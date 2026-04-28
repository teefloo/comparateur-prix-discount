import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  withText?: boolean
  size?: number
}

export default function Logo({ className = '', withText = true, size = 36 }: LogoProps) {
  return (
    <Link href="/" className={`group flex items-center gap-3 ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-accent shadow-accent-sm group-hover:shadow-accent-lg transition-shadow duration-300">
        <Image
          src="/logo.png"
          alt="Comparateur Prix Logo"
          width={size}
          height={size}
          className="object-cover"
        />
      </div>
      {withText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-foreground leading-none">
            Compar<span className="text-accent">Prix</span>
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted leading-tight mt-0.5">
            Discount
          </span>
        </div>
      )}
    </Link>
  )
}
