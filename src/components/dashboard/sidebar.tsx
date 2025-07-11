import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 h-full border-r bg-white p-4 space-y-4">
      <div className="text-lg font-bold">Menu</div>
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard" className="hover:text-blue-500">Home</Link>
        <Link href="/dashboard/credits" className="hover:text-blue-500">Credits</Link>
        <Link href="/dashboard/settings" className="hover:text-blue-500">Settings</Link>
      </nav>
    </aside>
  )
} 