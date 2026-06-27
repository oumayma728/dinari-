'use client'
// Transactions page is replaced by the tracking view on the Plan tab.
// Keep this route to avoid 404 but redirect to home.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TransactionsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return null
}
