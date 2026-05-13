'use client'
import { useRouter } from 'next/navigation'

interface SubPageHeaderProps {
  title: string
  backHref?: string
}

export function SubPageHeader({ title, backHref }: SubPageHeaderProps) {
  const router = useRouter()
  return (
    <div style={{ padding: '56px 20px 16px', background: 'white', borderBottom: '1px solid #EEF0F8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="back-btn" onClick={() => backHref ? router.push(backHref) : router.back()}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 5L9 11L14 17" stroke="#3B424E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2A3140' }}>{title}</h1>
      </div>
    </div>
  )
}
