'use client'
import { useRouter } from 'next/navigation'

interface SubPageHeaderProps {
  title: string
  backHref?: string
}

export function SubPageHeader({ title, backHref }: SubPageHeaderProps) {
  const router = useRouter()
  return (
    <div className="pt-14 px-5 pb-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <button className="back-btn" onClick={() => backHref ? router.push(backHref) : router.back()}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 5L9 11L14 17" stroke="#3B424E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-[18px] font-bold text-primary">{title}</h1>
      </div>
    </div>
  )
}
