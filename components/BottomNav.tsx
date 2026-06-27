'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, Tag, Sparkles, Heart } from 'lucide-react'

const tabs = [
  { href: '/',             icon: Home,           label: 'Home' },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/categories',   icon: Tag,             label: 'Categories' },
  { href: '/voice',        icon: Sparkles,        label: 'AI' },
  { href: '/wishlist',     icon: Heart,           label: 'Wishlist' },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(247,244,242,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid var(--border)',
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
                  width: 38, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8,
                  background: active ? 'var(--pink-light)' : 'transparent',
                }}>
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.6} color={active ? 'var(--pink)' : 'var(--faint)'} />
                </div>
                <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? 'var(--pink)' : 'var(--faint)', letterSpacing: '0.2px' }}>
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
