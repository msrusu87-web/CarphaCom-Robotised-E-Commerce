import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Warehouse Robotics Integration Subscriber
 * 
 * When an order is placed on CarphaCom, this subscriber sends the order
 * to the RoboFulfill Warehouse Orchestrator for robotic fulfillment.
 * The orchestrator assigns AGV robots to pick, pack and ship the items.
 * 
 * Part of: CarphaCom RoboFulfill — AI-Powered Warehouse Robotics
 * Hackathon: lablab.ai "AI Meets Robotics"
 */
export default async function warehouseRoboticsHandler({
  event: { data, name: eventName },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id
  console.log(`[Warehouse Robotics] 📦 Event "${eventName}" for order: ${orderId}`)

  const WAREHOUSE_URL = process.env.WAREHOUSE_ORCHESTRATOR_URL || "http://localhost:4000"

  try {
    // Fetch order details via Medusa's query
    const query = container.resolve("query")

    const { data: orders } = await query.graph({
      entity: "orders",
      filters: { id: orderId },
      fields: [
        "id",
        "display_id",
        "email",
        "status",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
      ],
    })

    const order = orders[0]
    if (!order) {
      console.log(`[Warehouse Robotics] Order not found: ${orderId}`)
      return
    }

    // Map order items to warehouse format with real category matching
    const warehouseItems = (order.items || []).map((item: any) => {
      const productHandle = item.variant?.product?.handle || ""
      const productId = item.variant?.product?.id || item.variant_id
      
      // Map product handle keywords to the 12 root warehouse zone categories
      let category = "diverse" // fallback
      
      const categoryRules: [RegExp, string][] = [
        [/statie|statii|cb[-\s]|radio[-\s]|pmr|uhf|vhf|scanner|poc|walkie|talkie|emisie/i, "statii-radio"],
        [/camera[-\s]ip|nvr|dvr|supraveghere|cctv|vanatoare|monitor[-\s]beb/i, "sisteme-supraveghere-video"],
        [/cablu|retea|solar|panel|conector|adaptor|baterie|acumulator|sursa|switch|calculator/i, "electrice-si-electronice"],
        [/alarma|securitate|control[-\s]acces|detector|gaz|fum|videointerf|automatizar[-\s]poart/i, "sisteme-securitate"],
        [/smart|inteligent|automat.*casa|termostat|iluminat/i, "smart-home"],
        [/auto|player|navigat|gps|senzor[-\s]parcar|radar|alarma[-\s]auto|box.*auto/i, "electronice-auto"],
        [/lanterna|audio|camera[-\s]act|jucari|inregistr/i, "foto-video-audio"],
        [/irigat|bucatari|aspirat|sera|purificat|anti[-\s]daunator|fiar.*calcat|hranitor/i, "casa-si-gradina"],
        [/telefon|tablet|card[-\s]memori|microsd/i, "telefoane-si-tablete"],
        [/aroma|termometr|tensiometr|meteo|sanatate|lamp.*trezir/i, "sanatate-si-wellness"],
        [/scul.*electri|dozator|bricolaj/i, "bricolaj-si-scule"],
      ]
      
      for (const [pattern, cat] of categoryRules) {
        if (pattern.test(productHandle) || pattern.test(item.title || "")) {
          category = cat
          break
        }
      }
      
      return {
        productId,
        title: item.title || item.variant?.product?.title || "Unknown Product",
        quantity: item.quantity || 1,
        category,
      }
    })

    // Send to warehouse orchestrator
    const orderNumber = `ORD-${order.display_id || orderId.slice(0, 8).toUpperCase()}`

    const response = await fetch(`${WAREHOUSE_URL}/api/warehouse/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        orderNumber,
        items: warehouseItems,
        customerEmail: order.email,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(
        `[Warehouse Robotics] ✅ Order ${orderNumber} sent to warehouse. Task: ${result.taskId}, Status: ${result.status}`
      )
    } else {
      const error = await response.text()
      console.error(`[Warehouse Robotics] ❌ Warehouse API error (${response.status}): ${error}`)
    }
  } catch (error) {
    console.error(`[Warehouse Robotics] ❌ Failed to connect to warehouse orchestrator:`, error)
    if (error instanceof Error) {
      console.error(`[Warehouse Robotics] Stack:`, error.stack)
    }
    // Don't throw — the order should still be processed even if the warehouse is down
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
}
