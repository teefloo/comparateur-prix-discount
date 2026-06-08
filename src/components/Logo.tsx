import Link from 'next/link'

interface LogoProps {
  className?: string
  withText?: boolean
  size?: number
}

const HORIZONTAL_RATIO = 740 / 180
const ICON_RATIO = 1
const BASE_PATH = '/brand/concept-2-etiquette'

export default function Logo({ className = '', withText = true, size = 44 }: LogoProps) {
  const variant = withText ? 'horizontal' : 'icon'
  const ratio = withText ? HORIZONTAL_RATIO : ICON_RATIO
  const width = Math.round(size * ratio)

  return (
    <Link
      href="/"
      className={`group inline-block ${className}`}
      aria-label="ComparPrix — Accueil"
    >
      {/* SVG is already vector and <3KB — next/image optimization is a no-op here */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${BASE_PATH}/${variant}.svg`}
        alt="ComparPrix — Le Bulletin des Prix Discount"
        width={width}
        height={size}
        className="block transition-transform duration-200 ease-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] dark:hidden"
        draggable={false}
      />
      <img
        src={`${BASE_PATH}/${variant}-dark.svg`}
        alt="ComparPrix — Le Bulletin des Prix Discount"
        width={width}
        height={size}
        className="hidden dark:block transition-transform duration-200 ease-out group-hover:-translate-x-[2px] group-hover:-translate-y-[2px]"
        draggable={false}
      />
    </Link>
  )
}
