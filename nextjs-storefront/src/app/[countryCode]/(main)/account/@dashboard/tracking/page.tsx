import { Metadata } from "next"
import AWBTracker from "@modules/account/components/awb-tracker"

export const metadata: Metadata = {
  title: "Package Tracking | CarphaCom",
  description: "Check the status of your parcel with any courier - FAN Courier, Sameday, Cargus, GLS, DPD",
}

export default function TrackingPage() {
  return (
    <div className="w-full" data-testid="tracking-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Package Tracking</h1>
        <p className="text-dark-300">
          Check the status of your shipments from any courier
        </p>
      </div>
      <AWBTracker />
    </div>
  )
}
