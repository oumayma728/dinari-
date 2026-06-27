'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function() { const r = useRouter(); useEffect(() => r.replace('/voice'), []); return null }
