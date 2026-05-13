'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Car } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Hyrje e suksesshme!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Email ose fjalëkalim i pasaktë')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Car className="text-blue-600" size={28} />
          <span className="text-2xl font-bold text-blue-600">AutoShqip</span>
        </div>

        <h2 className="text-center mb-6">Hyr në llogarinë tënde</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="label">Fjalëkalimi</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">Harrove fjalëkalimin?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? 'Duke hyrë...' : 'Hyr'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Nuk ke llogari?{' '}
          <Link href="/register" className="text-blue-600 font-medium hover:underline">Regjistrohu falas</Link>
        </p>
      </div>
    </div>
  )
}
