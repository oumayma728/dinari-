'use client'
// Chat removed — AI insights are now inline on each page.
// Keep route to avoid 404 but redirect home.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function ChatPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return null
}
