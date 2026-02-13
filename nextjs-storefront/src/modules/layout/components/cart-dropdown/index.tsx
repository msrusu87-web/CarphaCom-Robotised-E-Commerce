"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [liveCart, setLiveCart] = useState<HttpTypes.StoreCart | null | undefined>(cartState)

  // Sync with server-rendered cart prop
  useEffect(() => {
    setLiveCart(cartState)
  }, [cartState])

  // Listen for custom "cart-updated" events dispatched by addToCart etc.
  // Also poll on focus to catch server-action-driven changes
  useEffect(() => {
    const refreshCart = () => {
      fetch('/api/cart')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.cart) {
            setLiveCart(data.cart)
          }
        })
        .catch(() => {})
    }
    
    // Listen for custom events
    window.addEventListener('cart-updated', refreshCart)
    
    // Refresh on window focus (catches updates from server actions)
    window.addEventListener('focus', refreshCart)
    
    // Poll every 5 seconds when the tab is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshCart()
      }
    }, 5000)
    
    return () => {
      window.removeEventListener('cart-updated', refreshCart)
      window.removeEventListener('focus', refreshCart)
      clearInterval(interval)
    }
  }, [])

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    liveCart?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = liveCart?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton 
          className="h-full"
          aria-label={`Shopping Cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
        >
          <LocalizedClientLink
            className="flex items-center gap-1.5 px-2.5 py-1.5 small:px-4 small:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 font-semibold text-sm"
            href="/cart"
            data-testid="nav-cart-link"
            aria-label={`View shopping cart (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`}
          >
            <svg className="w-4 h-4 small:w-5 small:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden small:inline">Cart</span>
            <span className="inline-flex items-center justify-center w-5 h-5 bg-white/20 rounded-full text-xs" aria-hidden="true">{totalItems}</span>
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-dark-900 border border-dark-700 rounded-xl w-[420px] text-dark-100 shadow-2xl"
            data-testid="nav-cart-dropdown"
            role="dialog"
            aria-label="Shopping Cart"
          >
            <div className="p-4 flex items-center justify-center border-b border-dark-700">
              <h3 className="text-lg font-bold text-white">Shopping Cart</h3>
            </div>
            {liveCart && liveCart.items?.length ? (
              <>
                <ul className="overflow-y-scroll max-h-[402px] px-4 py-4 grid grid-cols-1 gap-y-4 no-scrollbar" aria-label="Items in Cart">
                  {liveCart.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <li
                        className="grid grid-cols-[100px_1fr] gap-x-4 bg-dark-800 rounded-lg p-3"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24 rounded-lg overflow-hidden"
                          aria-label={`View details ${item.title}`}
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[160px]">
                                <h4 className="text-sm font-medium text-white overflow-hidden text-ellipsis">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                    className="hover:text-primary-400 transition-colors"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h4>
                                <div className="text-dark-400 text-xs mt-1">
                                  <LineItemOptions
                                    variant={item.variant}
                                    data-testid="cart-item-variant"
                                    data-value={item.variant}
                                  />
                                </div>
                                <span
                                  className="text-dark-300 text-xs mt-1"
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Quantity: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end text-primary-400 font-semibold">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={liveCart.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-2 text-xs text-red-400 hover:text-red-300"
                            data-testid="cart-item-remove-button"
                            aria-label={`Remove ${item.title} from cart`}
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </li>
                    ))}
                </ul>
                <div className="p-4 border-t border-dark-700 flex flex-col gap-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-200 font-semibold">
                      Subtotal{" "}
                      <span className="font-normal text-dark-400">(excl. VAT)</span>
                    </span>
                    <span
                      className="text-xl font-bold text-primary-400"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: liveCart.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <button
                      className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                      data-testid="go-to-cart-button"
                      aria-label="View full shopping cart"
                    >
                      View Cart
                    </button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-dark-700 text-dark-300 flex items-center justify-center w-12 h-12 rounded-full" aria-hidden="true">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-dark-300">Your cart is empty.</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <button 
                        onClick={close}
                        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                        aria-label="Explore all products in our store"
                      >
                        Explore Products
                      </button>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
