"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  // Debug: log cart data
  console.log("Review cart data:", {
    hasShippingAddress: !!cart?.shipping_address,
    shippingMethodsLength: cart?.shipping_methods?.length,
    paymentCollection: !!cart?.payment_collection,
    isOpen
  })

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-bold text-white gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm">4</span>
          Order Review
        </Heading>
      </div>
      {isOpen && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-dark-300 leading-relaxed">
                By clicking Place Order, you confirm that you have read,
                understood and accepted the Terms and Conditions, Sale Policy
                and Return Policy, and that you have read the Privacy Policy
                of the store.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
