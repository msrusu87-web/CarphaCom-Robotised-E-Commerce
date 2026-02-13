import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      {price.price_type === "sale" && (
        <Text
          className="line-through text-dark-500 text-xs"
          data-testid="original-price"
        >
          {price.original_price}
        </Text>
      )}
      <Text
        className={clx("text-sm font-bold", {
          "text-sale": price.price_type === "sale",
          "text-primary-400": price.price_type !== "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
        <span className="text-xs font-normal text-dark-400 ml-1">+TVA</span>
      </Text>
    </div>
  )
}
