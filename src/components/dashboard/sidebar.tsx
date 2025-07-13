"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  PlusSquare,
  Wallet,
  KeyRound,
  History,
  Puzzle,
} from "lucide-react"

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Generate API",
    href: "/generate",
    icon: PlusSquare,
  },
  {
    title: "Buy Credits",
    href: "/buy-credits",
    icon: Wallet,
  },
  {
    title: "API Keys",
    href: "/keys",
    icon: KeyRound,
  },
  {
    title: "Credit History",
    href: "/history",
    icon: History,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Puzzle,
  },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 h-full border-r bg-white flex-col">
      <div className="p-6 border-b">
        <h1 className="text-lg font-semibold">DEEEP Platform</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
} 