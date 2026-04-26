import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  withText?: boolean
  size?: number
}

export default function Logo({ className = '', withText = true, size = 40 }: LogoProps) {
  return (
    <Link href="/" className={`group flex items-center gap-3 ${className}`}>
      <div className="relative overflow-hidden rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
        <Image 
          src="/logo.png" 
          alt="Comparateur Prix Logo" 
          width={size} 
          height={size}
          className="object-cover"
        />
      </div>
      {withText && (
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-heading font-bold tracking-tighter text-brand-navy">
            Compar<span className="text-brand-orange">Prix</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            Discount
          </span>
        </div>
      )}
    </Link>
  )
}
