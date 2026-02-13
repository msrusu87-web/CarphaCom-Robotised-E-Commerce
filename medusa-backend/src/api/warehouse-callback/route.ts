// CarphaCom Digital Twin — Warehouse ↔ Medusa Callback
// Called by the warehouse orchestrator when an order is fulfilled by robots
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOrderFulfillmentWorkflow, createOrderShipmentWorkflow } from "@medusajs/core-flows"

interface WarehouseCallbackBody {
  orderId: string
  status: "COMPLETED" | "FAILED"
  taskId: string
  robotName?: string
  completedAt?: number
  items?: { productName: string; quantity: number; picked: boolean }[]
}

// Generate a fake AWB tracking number
function generateAWB(orderId: string): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
  const seq = orderId.replace(/[^0-9]/g, "").slice(-4) || "0001"
  return `AWB-CARP-${dateStr}-${seq}`
}

export async function POST(
  req: MedusaRequest<WarehouseCallbackBody>,
  res: MedusaResponse
) {
  const { orderId, status, taskId, robotName, items } = req.body

  if (!orderId || !status) {
    return res.status(400).json({
      error: "Missing required fields: orderId, status",
    })
  }

  console.log(
    `🤖 Warehouse callback: Order ${orderId} → ${status} (task: ${taskId}, robot: ${robotName || "N/A"})`
  )

  if (status !== "COMPLETED") {
    return res.json({ success: true, message: `Status ${status} acknowledged` })
  }

  try {
    // 1. Query the order to get line items
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "display_id",
        "status",
        "items.*",
      ],
    })

    if (!order) {
      console.error(`❌ Order ${orderId} not found in Medusa`)
      return res.status(404).json({ error: `Order ${orderId} not found` })
    }

    console.log(
      `📋 Order ${orderId} (#${order.display_id}): ${order.items?.length || 0} line items found`
    )

    // 2. Build fulfillment items from all order items
    const fulfillmentItems = (order.items || []).map((item: any) => ({
      id: item.id,
      quantity: item.detail?.quantity || item.quantity || 1,
    }))

    if (fulfillmentItems.length === 0) {
      console.log(`⚠️ Order ${orderId} has no items to fulfill`)
      return res.json({
        success: true,
        message: "No items to fulfill",
        orderId,
      })
    }

    // 3. Run the fulfillment workflow
    console.log(
      `📦 Creating fulfillment for order ${orderId} with ${fulfillmentItems.length} items...`
    )

    const { result: fulfillment } = await createOrderFulfillmentWorkflow(
      req.scope
    ).run({
      input: {
        order_id: orderId,
        items: fulfillmentItems,
        location_id: "sloc_8B36D7BC2D9C4DBEABD78BD5", // "Depozit Principal"
        no_notification: false,
        created_by: "warehouse-digital-twin",
        metadata: {
          source: "digital-twin",
          taskId,
          robotName: robotName || "AGV",
          completedAt: new Date().toISOString(),
          itemsProcessed: items || [],
        },
      },
    })

    const fulfillmentId = fulfillment?.id
    console.log(
      `✅ Fulfillment created for order ${orderId}: ${fulfillmentId || "OK"}`
    )

    // 4. Create shipment with AWB tracking number
    let awbNumber = ""
    let shipmentCreated = false
    if (fulfillmentId) {
      try {
        awbNumber = generateAWB(orderId)
        console.log(`🚚 Creating shipment for ${orderId} with AWB: ${awbNumber}`)

        await createOrderShipmentWorkflow(req.scope).run({
          input: {
            order_id: orderId,
            fulfillment_id: fulfillmentId,
            items: fulfillmentItems,
            labels: [
              {
                tracking_number: awbNumber,
                tracking_url: `https://tracking.fan-courier.ro/${awbNumber}`,
                label_url: "",
              },
            ],
            no_notification: false,
            created_by: "warehouse-digital-twin",
            metadata: {
              source: "digital-twin",
              robotName: robotName || "AGV",
              shipped_at: new Date().toISOString(),
            },
          },
        })

        shipmentCreated = true
        console.log(`✅ Shipment created for order ${orderId}: AWB ${awbNumber}`)
      } catch (shipErr: any) {
        console.error(`⚠️ Shipment creation failed for ${orderId}:`, shipErr?.message)
      }
    }

    // 5. Update order metadata with AWB and mark as shipped
    try {
      const adminToken = await getAdminToken()
      if (adminToken) {
        // Save AWB to order metadata
        await fetch("http://localhost:9000/admin/orders/" + orderId, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + adminToken,
          },
          body: JSON.stringify({
            metadata: {
              awb_number: awbNumber,
              awb_added_at: new Date().toISOString(),
              warehouse_completed: true,
              admin_accepted: true,
              accepted_at: new Date().toISOString(),
              warehouse_robot: robotName || "AGV",
              warehouse_task: taskId,
            },
          }),
        })
        console.log(`📝 Order ${orderId} metadata updated with AWB: ${awbNumber}`)

        // 6. Trigger invoice generation via admin panel API
        try {
          const invoiceRes = await fetch("http://localhost:3000/app/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "generate-invoice",
              orderId: orderId,
            }),
          })

          if (invoiceRes.ok) {
            const invoiceData = await invoiceRes.json() as any
            console.log(`🧾 Invoice generated for order ${orderId}: ${invoiceData?.invoice?.serie || ""}${invoiceData?.invoice?.numar || ""}`)
          } else {
            console.error(`⚠️ Invoice generation failed for ${orderId}: ${invoiceRes.status}`)
          }
        } catch (invErr: any) {
          console.error(`⚠️ Invoice trigger failed for ${orderId}:`, invErr?.message)
        }

        // 7. Mark order as completed via Medusa admin API
        try {
          const completeRes = await fetch("http://localhost:9000/admin/orders/" + orderId + "/complete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + adminToken,
            },
          })
          if (completeRes.ok) {
            console.log(`🎉 Order ${orderId} marked as COMPLETED in Medusa`)
          } else {
            const errBody = await completeRes.text()
            console.error(`⚠️ Order completion failed for ${orderId}: ${completeRes.status} ${errBody}`)
          }
        } catch (complErr: any) {
          console.error(`⚠️ Order completion failed for ${orderId}:`, complErr?.message)
        }
      }
    } catch (metaErr: any) {
      console.error(`⚠️ Metadata / AWB update failed for ${orderId}:`, metaErr?.message)
    }

    return res.json({
      success: true,
      message: "Order fulfilled, shipped, and invoiced successfully",
      orderId,
      fulfillmentId,
      awbNumber,
      shipmentCreated,
    })
  } catch (error: any) {
    const errorMsg = error?.message || String(error)
    console.error(`❌ Fulfillment error for order ${orderId}:`, errorMsg)

    // Handle "already fulfilled" gracefully
    if (errorMsg.includes("No stock reservation") || errorMsg.includes("already fulfilled")) {
      return res.json({
        success: true,
        message: "Order already fulfilled or no stock reservation needed",
        orderId,
      })
    }

    return res.status(500).json({
      error: "Failed to create fulfillment",
      details: errorMsg,
      orderId,
    })
  }
}

// ══════════════════════════════════════════════════════
// Admin token cache for metadata updates
// ══════════════════════════════════════════════════════
let cachedAdminToken: string | null = null
let tokenExpiry = 0

async function getAdminToken(): Promise<string | null> {
  if (cachedAdminToken && Date.now() < tokenExpiry) {
    return cachedAdminToken
  }
  try {
    const res = await fetch("http://localhost:9000/auth/user/emailpass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@example.com",
        password: "YOUR_ADMIN_PASSWORD",
      }),
    })
    if (res.ok) {
      const data = await res.json() as any
      cachedAdminToken = data.token
      tokenExpiry = Date.now() + 3600000 // 1 hour
      return cachedAdminToken
    }
  } catch (err: any) {
    console.error("Failed to get admin token:", err?.message)
  }
  return null
}

// Health check for this endpoint
export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
) {
  res.json({
    status: "ok",
    endpoint: "warehouse-callback",
    description: "Receives fulfillment updates from CarphaCom Digital Twin — creates fulfillment, shipment with AWB, invoice, and completes order",
  })
}
