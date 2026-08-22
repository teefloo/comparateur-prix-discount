import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  withText?: boolean
  size?: number
}

const HORIZONTAL_RATIO = 300 / 64
const ICON_RATIO = 1
const BASE_PATH = '/brand'

export default function Logo({ className = '', withText = true, size = 44 }: LogoProps) {
  const variant = withText ? 'comparprix-horizontal' : 'comparprix-icon'
  const ratio = withText ? HORIZONTAL_RATIO : ICON_RATIO
  const width = Math.round(size * ratio)

  return (
    <Link
      href="/"
      className={`group inline-block ${className}`}
      aria-label="ComparPrix — Accueil"
    >
      <Image
        src={`${BASE_PATH}/${variant}.svg`}
        alt="ComparPrix — Le Bulletin des Prix Discount"
        width={width}
        height={size}
        priority
        className="block dark:hidden"
        draggable={false}
      />
      <Image
        src={`${BASE_PATH}/${variant}-dark.svg`}
        alt="ComparPrix — Le Bulletin des Prix Discount"
        width={width}
        height={size}
        priority
        className="hidden dark:block"
        draggable={false}
      />
    </Link>
  )
}
