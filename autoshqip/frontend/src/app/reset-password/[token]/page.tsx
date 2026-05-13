'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Car } from 'lucide-react'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return toast.error('Fjalëkalimet nuk përputhen')
    if (password.length < 8) return toast.error('Të paktën 8 karaktere')
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      toast.success('Fjalëkalimi u ndryshua!')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Linku ka skaduar')
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
        <h2 className="text-center mb-6">Rivendos Fjalëkalimin</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Fjalëkalimi i Ri</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <label className="label">Konfirmo Fjalëkalimin</label>
            <input type="password" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? 'Duke ndryshuar...' : 'Ndrysho Fjalëkalimin'}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">← Kthehu tek Hyrja</Link>
        </p>
      </div>
    </div>
  )
}
