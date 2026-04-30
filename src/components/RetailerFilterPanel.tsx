'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'

import RetailerFilter from './RetailerFilter'

export default function RetailerFilterPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const rawRetailer = searchParams.get('retailer')
  const selectedRetailers = rawRetailer ? rawRetailer.split(',').filter(Boolean) : []

  const onChange = useCallback(
    (retailers: string[]) => {
      const params = new URLSearchParams(searchParams.toString())
      if (retailers.length > 0) {
        params.set('retailer', retailers.join(','))
      } else {
        params.delete('retailer')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return <RetailerFilter selectedRetailers={selectedRetailers} onChange={onChange} />
}
