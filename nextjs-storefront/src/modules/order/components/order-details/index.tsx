import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="bg-dark-700/50 rounded-xl p-4">
      <Text className="text-dark-300">
        We sent an order confirmation to{" "}
        <span
          className="text-primary-400 font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2 text-dark-300">
        Order date:{" "}
        <span data-testid="order-date" className="text-white">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-accent-500 font-semibold">
        Order Number: <span data-testid="order-id">#{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text className="text-dark-300">
              Order Status:{" "}
              <span className="text-primary-400" data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text className="text-dark-300">
              Payment Status:{" "}
              <span
                className="text-primary-400"
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
