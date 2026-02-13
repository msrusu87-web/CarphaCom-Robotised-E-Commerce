"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession, createPaymentCollection, createPaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

// Bank details type from admin settings
interface BankDetails {
  bankName: string
  iban: string
  beneficiary: string
  bankDetails: string
  cui?: string
}

// Payment method from admin settings API
interface PaymentSetting {
  id: string
  name: string
  type: string
  logo: string
  fee: string
  bankName?: string
  iban?: string
  beneficiary?: string
  bankDetails?: string
  cui?: string
  feeFixed?: number
}

const SETTINGS_URL = typeof window !== 'undefined' 
  ? '/app/api/settings/payments?public=1'
  : 'http://localhost:3000/app/api/settings/payments?public=1'

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? "cod"
  )
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([])
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Load payment settings from admin API
  useEffect(() => {
    fetch(SETTINGS_URL)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.payments)) {
          setPaymentSettings(data.payments)
        }
        setSettingsLoaded(true)
      })
      .catch(() => setSettingsLoaded(true))
  }, [])

  // Derived: active payment method IDs from admin settings
  const isCodActive = paymentSettings.some(p => p.id === 'cod')
  const bankSetting = paymentSettings.find(p => p.id === 'bank')
  const isBankActive = !!bankSetting
  const isCardActive = paymentSettings.some(p => p.type === 'card')
  const payuSetting = paymentSettings.find(p => p.id === 'payu')
  const isPayuActive = !!payuSetting

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // For manual payment methods (COD, bank-transfer), we consider payment "ready"
  // when a selection is made, even without a payment session
  const hasManualPayment = selectedPaymentMethod === "cod" || selectedPaymentMethod === "bank-transfer" || selectedPaymentMethod === "payu-card"
  
  // Check if shipping is configured (either via Medusa shipping methods OR fixed-rate courier in metadata)
  const hasShipping = (cart?.shipping_methods?.length ?? 0) > 0 || !!cart?.metadata?.courier
  
  const paymentReady =
    (activeSession && hasShipping) ||
    paidByGiftcard ||
    (hasManualPayment && hasShipping)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // For manual payment methods (COD, bank transfer), ensure payment collection exists
      if (selectedPaymentMethod === "cod" || selectedPaymentMethod === "bank-transfer" || selectedPaymentMethod === "payu-card") {
        // Store selected payment for the review step
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('selectedPaymentMethod', selectedPaymentMethod)
        }
        try {
          // Step 1: Create payment collection if it doesn't exist
          let paymentCollectionId = cart.payment_collection?.id
          if (!paymentCollectionId) {
            const paymentCollection = await createPaymentCollection(cart.id)
            paymentCollectionId = paymentCollection?.id
          }
          
          // Step 2: Create payment session if payment collection exists and no active session
          if (paymentCollectionId && !activeSession) {
            await createPaymentSession(paymentCollectionId, "pp_system_default")
          }
        } catch (sessionErr: any) {
          console.warn('Payment session creation warning:', sessionErr?.message || sessionErr)
          // Don't block - some edge cases may still work
        }
        
        setIsLoading(false)
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }

      const shouldInputCard = isStripeLike(selectedPaymentMethod) && !activeSession
      const checkActiveSession = activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          { scroll: false }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-bold text-white gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          <span className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm">3</span>
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid className="text-accent-500" />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-primary-400 hover:text-primary-300 font-medium"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && !(availablePaymentMethods.length === 1 && availablePaymentMethods[0].id === "pp_system_default") ? (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          ) : !paidByGiftcard ? (
            <>
              <div className="mb-4">
                <p className="text-dark-300 text-sm mb-4">
                  Select your preferred payment method:
                </p>
                <RadioGroup
                  value={selectedPaymentMethod}
                  onChange={(value: string) => setSelectedPaymentMethod(value)}
                >
                  {isCodActive && (
                    <Radio 
                      value="cod" 
                      className="flex items-start gap-x-3 p-4 bg-dark-700 border border-dark-600 rounded-xl mb-3 hover:border-primary-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-primary-500 bg-primary-500" : "border-dark-400"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">💵 Cash on Delivery</span>
                              <span className="px-2 py-0.5 bg-accent-500/20 text-accent-400 text-xs rounded-full">Recommended</span>
                            </div>
                            <p className="text-dark-300 text-sm">Pay cash when you receive your package</p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {isBankActive && bankSetting && (
                    <Radio 
                      value="bank-transfer" 
                      className="flex items-start gap-x-3 p-4 bg-dark-700 border border-dark-600 rounded-xl mb-3 hover:border-primary-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-primary-500 bg-primary-500" : "border-dark-400"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">🏦 Bank Transfer</span>
                            </div>
                            <p className="text-dark-300 text-sm">You'll receive bank details by email after placing the order</p>
                            <div className="mt-2 p-3 bg-dark-600/50 rounded-lg text-xs text-dark-300">
                              {bankSetting.iban && <p><strong className="text-white">IBAN:</strong> {bankSetting.iban}</p>}
                              {bankSetting.beneficiary && <p><strong className="text-white">Beneficiary:</strong> {bankSetting.beneficiary}</p>}
                              {bankSetting.bankName && <p><strong className="text-white">Bank:</strong> {bankSetting.bankName}</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {isPayuActive && (
                    <Radio 
                      value="payu-card" 
                      className="flex items-start gap-x-3 p-4 bg-dark-700 border border-dark-600 rounded-xl mb-3 hover:border-primary-500 transition cursor-pointer"
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className={clx(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                            checked ? "border-primary-500 bg-primary-500" : "border-dark-400"
                          )}>
                            {checked && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">💳 Card Online (PayU)</span>
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Secure</span>
                            </div>
                            <p className="text-dark-300 text-sm">Secure payment with Visa / Mastercard via PayU</p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                  {!isPayuActive && !isCardActive && (
                    <Radio 
                      value="card-online" 
                      className="flex items-start gap-x-3 p-4 bg-dark-700/50 border border-dark-600 rounded-xl opacity-50 cursor-not-allowed"
                      disabled
                    >
                      {({ checked }: { checked: boolean }) => (
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-5 h-5 rounded-full border-2 border-dark-500 flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 bg-dark-500 rounded-full" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-dark-400 font-medium">💳 Card Online</span>
                              <span className="px-2 py-0.5 bg-dark-600 text-dark-400 text-xs rounded-full">Coming soon</span>
                            </div>
                            <p className="text-dark-400 text-sm">Secure card payment (coming soon)</p>
                          </div>
                        </div>
                      )}
                    </Radio>
                  )}
                </RadioGroup>
              </div>
            </>
          ) : null}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-white font-semibold mb-1">
                Payment Method
              </Text>
              <Text
                className="txt-medium text-dark-300"
                data-testid="payment-method-summary"
              >
                Gift Card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6 w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter card details"
              : "Continue to Review"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-white font-semibold mb-1">
                  Payment Method
                </Text>
                <Text
                  className="txt-medium text-dark-300"
                  data-testid="payment-method-summary"
                >
                  {selectedPaymentMethod === "cod" ? "💵 Cash on Delivery" :
                   selectedPaymentMethod === "bank-transfer" ? "🏦 Bank Transfer" :
                   selectedPaymentMethod === "payu-card" ? "💳 Card Online (PayU)" :
                   paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
                </Text>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-white font-semibold mb-1">
                Payment Method
              </Text>
              <Text
                className="txt-medium text-dark-300"
                data-testid="payment-method-summary"
              >
                Gift Card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
