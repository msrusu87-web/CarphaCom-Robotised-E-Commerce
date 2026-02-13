"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import WarehouseTrackingWidget from "@modules/order/components/warehouse-tracking"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Order Details</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-dark-300 hover:text-primary-400 transition-colors"
          data-testid="back-to-overview-button"
        >
          <XMark /> Back to Orders
        </LocalizedClientLink>
      </div>
      <div
        className="flex flex-col gap-4 h-full w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <WarehouseTrackingWidget orderId={order.id} />
        <Items order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
