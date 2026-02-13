import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function({ container }: ExecArgs) {
  // Get services
  const regionService = container.resolve(Modules.REGION)
  const currencyService = container.resolve(Modules.CURRENCY)

  console.log("Setting up store data...")

  // Check if region already exists
  const existingRegions = await regionService.listRegions()
  if (existingRegions.length > 0) {
    console.log("Regions already exist:", existingRegions.map((r: any) => r.name))
    return
  }

  // Create Romania region
  const region = await regionService.createRegions({
    name: "România",
    currency_code: "ron",
    countries: ["ro"],
    metadata: {},
  })

  console.log("Created region:", region.name)
  console.log("Region ID:", region.id)
  console.log("Currency: RON")
  console.log("\nStore setup complete!")
}
