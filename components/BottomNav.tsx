'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, MessageCircle, Heart, Settings } from 'lucide-react'

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/transactions', icon: BarChart2, label: 'Spend' },
  { href: '/chat', icon: MessageCircle, label: 'Ask AI' },
  { href: '/wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(251,249,246,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '0.5px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0' }}>
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}
                />
                <span style={{
                  fontSize: 10,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
