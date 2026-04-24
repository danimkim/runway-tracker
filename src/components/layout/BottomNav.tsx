'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3L19 9.5V19a1 1 0 01-1 1H14v-5H8v5H4a1 1 0 01-1-1V9.5z"
          stroke={active ? '#3B424E' : '#AAB5C5'} strokeWidth="1.7"
          fill={active ? '#EEF0F8' : 'none'} strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3"
          stroke={active ? '#3B424E' : '#AAB5C5'} strokeWidth="1.7"
          fill={active ? '#EEF0F8' : 'none'}/>
        <path d="M7 8h8M7 11h8M7 14h5" stroke={active ? '#3B424E' : '#AAB5C5'}
          strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke={active ? '#3B424E' : '#AAB5C5'} strokeWidth="1.7"
          fill={active ? '#EEF0F8' : 'none'}/>
        <path d="M11 2.5v2M11 17.5v2M2.5 11h2M17.5 11h2M4.7 4.7l1.4 1.4M15.9 15.9l1.4 1.4M4.7 17.3l1.4-1.4M15.9 6.1l1.4-1.4"
          stroke={active ? '#3B424E' : '#AAB5C5'} strokeWidth="1.7" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'white', borderTop: '1px solid #EEF0F8',
      display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      boxShadow: '0 -4px 20px rgba(59,66,78,0.08)', zIndex: 100,
    }}>
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href} style={{
            flex: 1, padding: '10px 0 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            textDecoration: 'none',
          }}>
            {tab.icon(active)}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#3B424E' : '#AAB5C5' }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
