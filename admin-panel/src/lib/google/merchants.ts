/**
 * Google Merchant Center API Service (Merchant API v1beta)
 * Manages product feeds, inventory, and Merchant Center operations
 * Using the new Merchant API instead of deprecated Content API
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export interface MerchantProduct {
  id: string
  title: string
  description: string
  link: string
  imageLink: string
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder'
  price: {
    value: string
    currency: string
  }
  brand?: string
  gtin?: string
  mpn?: string
  condition: 'new' | 'refurbished' | 'used'
  googleProductCategory?: string
  productTypes?: string[]
}

export interface MerchantStats {
  totalProducts: number
  approved: number
  pending: number
  disapproved: number
  clicks?: number
  impressions?: number
  ctr?: number
  avgPosition?: number
}

export class GoogleMerchantsService {
  private merchantId: string
  private merchant: any
  private datasources: any
  private cachedDataSourceName: string | null = null

  constructor(auth: OAuth2Client) {
    this.merchantId = process.env.GOOGLE_MERCHANT_ID || ''
    // Use new Merchant API instead of deprecated Content API
    this.merchant = google.merchantapi({ version: 'products_v1beta', auth })
    this.datasources = google.merchantapi({ version: 'datasources_v1beta', auth })
  }

  /**
   * Get or create an API-type primary product data source.
   * Required by productInputs.insert as a query parameter.
   */
  async getOrCreateApiDataSource(): Promise<string> {
    if (this.cachedDataSourceName) {
      return this.cachedDataSourceName
    }

    const parent = `accounts/${this.merchantId}`

    try {
      // List existing data sources
      const listRes = await this.datasources.accounts.dataSources.list({
        parent,
        pageSize: 1000,
      })

      const dataSources = listRes.data.dataSources || []

      // Find an existing API-type primary product data source
      const apiSource = dataSources.find(
        (ds: any) =>
          ds.input === 'API' &&
          ds.primaryProductDataSource &&
          (ds.primaryProductDataSource.channel === 'ONLINE_PRODUCTS' ||
           ds.primaryProductDataSource.channel === 'PRODUCTS')
      )

      if (apiSource) {
        console.log(`Found existing API data source: ${apiSource.name} (${apiSource.displayName})`)
        this.cachedDataSourceName = apiSource.name
        return apiSource.name
      }

      // No API data source found — create one
      console.log('No API data source found, creating one...')
      const createRes = await this.datasources.accounts.dataSources.create({
        parent,
        requestBody: {
          displayName: 'Carphatian API Feed',
          primaryProductDataSource: {
            channel: 'ONLINE_PRODUCTS',
            feedLabel: 'RO',
            contentLanguage: 'ro',
            countries: ['RO'],
          },
        },
      })

      const newSource = createRes.data
      console.log(`Created API data source: ${newSource.name} (${newSource.displayName})`)
      this.cachedDataSourceName = newSource.name
      return newSource.name
    } catch (error) {
      console.error('Error getting/creating API data source:', error)
      throw new Error('Failed to get or create API data source for Merchant Center')
    }
  }

  /**
   * Get all products from Merchant Center
   */
  async listProducts(): Promise<any[]> {
    try {
      const parent = `accounts/${this.merchantId}`
      const response = await this.merchant.accounts.products.list({
        parent,
        pageSize: 250,
      })
      return response.data.products || []
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('Error listing products:', error)
      throw new Error(msg || 'Failed to fetch products from Merchant Center')
    }
  }

  /**
   * Get product status (approved, pending, disapproved)
   */
  async getProductStatuses(): Promise<any[]> {
    try {
      // New Merchant API includes status in product resource
      const products = await this.listProducts()
      return products.map((product: any) => ({
        productId: product.name,
        title: product.attributes?.title || '',
        channel: product.channel,
        status: product.productStatus || {},
      }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('Error getting product statuses:', error)
      if (msg.includes('has not been used in project') || msg.includes('is disabled')) {
        throw error
      }
      return []
    }
  }

  /**
   * Get Merchant Center statistics
   */
  async getStats(): Promise<MerchantStats> {
    try {
      const statuses = await this.getProductStatuses()
      
      const stats: MerchantStats = {
        totalProducts: statuses.length,
        approved: 0,
        pending: 0,
        disapproved: 0,
      }

      statuses.forEach((status: any) => {
        const productStatus = status.status?.destinationStatuses || []
        const googleShoppingStatus = productStatus.find(
          (d: any) => d.reportingContext === 'SHOPPING_ADS'
        )

        if (googleShoppingStatus) {
          const approvedCountries = googleShoppingStatus.approvedCountries || []
          const pendingCountries = googleShoppingStatus.pendingCountries || []
          const disapprovedCountries = googleShoppingStatus.disapprovedCountries || []
          
          if (approvedCountries.length > 0) {
            stats.approved++
          } else if (pendingCountries.length > 0) {
            stats.pending++
          } else if (disapprovedCountries.length > 0) {
            stats.disapproved++
          }
        }
      })

      return stats
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('Error getting merchant stats:', error)
      throw new Error(msg || 'Failed to fetch Merchant Center statistics')
    }
  }

  /**
   * Insert or update a product in Merchant Center
   */
  async upsertProduct(product: MerchantProduct): Promise<any> {
    try {
      const parent = `accounts/${this.merchantId}`
      const dataSource = await this.getOrCreateApiDataSource()
      
      const productData = {
        parent,
        product: {
          offerId: product.id,
          contentLanguage: 'ro',
          feedLabel: 'RO',
          channel: 'ONLINE',
          attributes: {
            title: product.title,
            description: product.description,
            link: product.link,
            imageLink: product.imageLink,
            availability: product.availability.toUpperCase(),
            price: {
              amountMicros: Math.round(parseFloat(product.price.value) * 1000000).toString(),
              currencyCode: product.price.currency,
            },
            condition: product.condition.toUpperCase(),
            brand: product.brand || 'Carphatian',
            gtin: product.gtin,
            mpn: product.mpn,
            googleProductCategory: product.googleProductCategory,
            productTypes: product.productTypes,
          },
        },
      }

      const response = await this.merchant.accounts.productInputs.insert({
        parent,
        dataSource,
        requestBody: productData.product,
      })
      return response.data
    } catch (error) {
      console.error('Error upserting product:', error)
      throw new Error(`Failed to sync product ${product.id} to Merchant Center`)
    }
  }

  /**
   * Delete a product from Merchant Center
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      const name = `accounts/${this.merchantId}/productInputs/${productId}`
      const dataSource = await this.getOrCreateApiDataSource()
      await this.merchant.accounts.productInputs.delete({ name, dataSource })
    } catch (error) {
      console.error('Error deleting product:', error)
      throw new Error(`Failed to delete product ${productId} from Merchant Center`)
    }
  }

  /**
   * Get product issues (why products are disapproved)
   */
  async getProductIssues(): Promise<any[]> {
    try {
      const statuses = await this.getProductStatuses()
      const issues: any[] = []

      statuses.forEach((status: any) => {
        const productStatus = status.status?.destinationStatuses || []
        const googleShoppingStatus = productStatus.find(
          (d: any) => d.reportingContext === 'SHOPPING_ADS'
        )

        if (googleShoppingStatus) {
          const disapprovedCountries = googleShoppingStatus.disapprovedCountries || []
          const pendingCountries = googleShoppingStatus.pendingCountries || []
          
          if (disapprovedCountries.length > 0) {
            issues.push({
              productId: status.productId,
              title: status.title,
              issues: disapprovedCountries,
              severity: 'error',
            })
          } else if (pendingCountries.length > 0) {
            issues.push({
              productId: status.productId,
              title: status.title,
              issues: pendingCountries,
              severity: 'warning',
            })
          }
        }
      })

      return issues
    } catch (error) {
      console.error('Error getting product issues:', error)
      return []
    }
  }

  /**
   * Sync all Medusa products to Merchant Center (parallel batches of 5)
   */
  async syncAllProducts(medusaProducts: any[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    const BATCH_SIZE = 5

    // Pre-warm the data source cache
    await this.getOrCreateApiDataSource()

    for (let i = 0; i < medusaProducts.length; i += BATCH_SIZE) {
      const batch = medusaProducts.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (product) => {
          const merchantProduct: MerchantProduct = {
            id: product.id,
            title: product.title.substring(0, 150),
            description: (product.description || product.title).substring(0, 5000),
            link: `https://www.YOUR_PNI_USERNAMEtrafic.ro/ro/products/${product.handle}`,
            imageLink: product.thumbnail || '',
            availability: product.status === 'published' ? 'in_stock' : 'out_of_stock',
            price: {
              value: ((product.variants?.[0]?.prices?.[0]?.amount || 0) / 100).toFixed(2),
              currency: 'RON',
            },
            condition: 'new',
            brand: product.metadata?.brand || 'Carphatian',
            gtin: product.metadata?.gtin || undefined,
            mpn: product.id,
          }
          return this.upsertProduct(merchantProduct)
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          success++
        } else {
          failed++
          console.error(`Batch sync error: ${result.reason?.message || result.reason}`)
        }
      }
    }

    return { success, failed }
  }
}
