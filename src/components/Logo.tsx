import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  withText?: boolean
  size?: number
}

export default function Logo({ className = '', withText = true, size = 40 }: LogoProps) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-card transition-transform duration-300 group-hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900">
        <Image src="/logo.png" alt="ComparPrix" width={size} height={size} className="rounded-xl object-cover" />
      </div>
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-[1.05rem] font-semibold tracking-tight text-foreground dark:text-slate-100">
            Compar<span className="text-accent">Prix</span>
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] text-subtle dark:text-slate-500">
            Discount intelligence
          </span>
        </div>
      )}
    </Link>
  )
}
