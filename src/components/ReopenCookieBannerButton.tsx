'use client'

import { Cookie } from 'lucide-react'

import { cn } from '@/lib/utils'

type ReopenCookieBannerButtonProps = {
  className?: string
  children?: React.ReactNode
}

export default function ReopenCookieBannerButton({
  className,
  children,
}: ReopenCookieBannerButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          window.localStorage.removeItem('comparprix.cookie-consent')
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent('comparprix:reopen-cookie-banner'))
      }}
      className={cn(
        'group inline-flex items-center gap-1.5 text-ink-soft underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy',
        className,
      )}
    >
      <Cookie size={12} strokeWidth={2.5} className="shrink-0" />
      {children ?? 'Gérer mes cookies'}
    </button>
  )
}
