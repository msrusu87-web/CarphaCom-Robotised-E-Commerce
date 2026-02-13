import { Metadata } from "next"
// ISR - Revalidate every 120 seconds
export const revalidate = 120

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store | CarphaCom",
  description: "Explore all our products: CB radios, antennas, walkie talkies and accessories.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    brand?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, q, brand } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchQuery={q}
      brand={brand}
    />
  )
}
