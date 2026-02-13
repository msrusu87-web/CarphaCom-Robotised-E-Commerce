import { Sidebar } from "@/components/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      {/* Main content - offset for fixed sidebar on desktop, header on mobile */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 pt-20 lg:pt-6 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
