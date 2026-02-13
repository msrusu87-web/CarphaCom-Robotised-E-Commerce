import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "styles/globals.css"

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "CarphaCom | Robotised E-Commerce — Radio & Electronics",
    template: "%s | CarphaCom",
  },
  description: "AI-powered robotised e-commerce for CB radios, antennas, surveillance, electronics and smart home. Automated warehouse fulfilment by Qubit Page Limited.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.mypni.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.mypni.com" />
        <link rel="dns-prefetch" href="https://www.mypni.eu" />
      </head>
      <body className={inter.className}>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
