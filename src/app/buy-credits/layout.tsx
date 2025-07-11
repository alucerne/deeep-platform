import DashboardSidebar from "@/components/dashboard/sidebar"
import Header from "@/components/dashboard/header"

export default function BuyCreditsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
} 