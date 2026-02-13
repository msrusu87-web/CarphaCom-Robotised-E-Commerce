"use client"

import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useState } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  priority?: boolean // Add priority for above-the-fold images
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  priority = false,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden bg-dark-700 border-2 border-dark-600 shadow-md rounded-lg group-hover:border-primary-500/50 group-hover:shadow-primary-500/20 transition-all ease-in-out duration-150",
        className,
        {
          "aspect-square": true,
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} priority={priority} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  priority = false,
}: Pick<ThumbnailProps, "size" | "priority"> & { image?: string }) => {
  const [hasError, setHasError] = useState(false)

  if (!image || hasError) {
    return (
      <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-dark-600">
        <PlaceholderImage size={size === "small" ? 16 : 24} />
      </div>
    )
  }

  return (
    <Image
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 w-full h-full object-contain p-2"
      draggable={false}
      quality={75}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={() => setHasError(true)}
    />
  )
}

export default Thumbnail
