'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import RetailerFilter from './RetailerFilter'

interface RetailerFilterPanelProps {
  defaultExpanded?: boolean
}

export default function RetailerFilterPanel({ defaultExpanded = false }: RetailerFilterPanelProps) {
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
      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams],
  )

  return <RetailerFilter selectedRetailers={selectedRetailers} onChange={onChange} defaultExpanded={defaultExpanded} />
}
