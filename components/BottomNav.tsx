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
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(245,244,241,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid rgba(26,22,20,0.08)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', padding: '8px 0 4px' }}>
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = path === href
          return (
            <Link key={href} href={href} style={{ flex: 1, textDecoration: 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0' }}>
                <div style={{
                  width: 40, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 10,
                  background: active ? 'rgba(26,46,47,0.08)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.6} color={active ? 'var(--primary)' : 'var(--text-faint)'} />
                </div>
                <span style={{
                  fontSize: 10, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--primary)' : 'var(--text-faint)',
                  letterSpacing: active ? '0.1px' : 0,
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
