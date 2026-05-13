'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Car, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch {
      toast.error('Gabim. Provo përsëri.')
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

        {sent ? (
          <div className="text-center">
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <h2 className="mb-2">Kontrollo Emailin</h2>
            <p className="text-gray-600 mb-6">Nëse emaili ekziston, do të marrësh një link për rivendosjen e fjalëkalimit.</p>
            <Link href="/login" className="btn-primary inline-block">Kthehu tek Hyrja</Link>
          </div>
        ) : (
          <>
            <h2 className="text-center mb-2">Harrove Fjalëkalimin?</h2>
            <p className="text-center text-gray-500 text-sm mb-6">Shkruaj emailin tënd dhe do të të dërgojmë udhëzime.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
                {loading ? 'Duke dërguar...' : 'Dërgo Linkun'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-4">
              <Link href="/login" className="text-blue-600 hover:underline">← Kthehu tek Hyrja</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
