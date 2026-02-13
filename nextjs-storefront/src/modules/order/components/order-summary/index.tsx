import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
      <div className="text-small-regular text-dark-300 my-2 bg-dark-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between text-base-regular text-dark-200 mb-2">
          <span>Subtotal</span>
          <span>{getAmount(order.subtotal)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {order.discount_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span className="text-accent-400">- {getAmount(order.discount_total)}</span>
            </div>
          )}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Gift Card</span>
              <span className="text-accent-400">- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{getAmount(order.shipping_total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>VAT</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-dark-600 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-white font-semibold mb-2">
          <span>Total</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
