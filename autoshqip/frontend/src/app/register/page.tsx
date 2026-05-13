'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Car, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', referralCode: refCode })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Fjalëkalimi duhet të ketë të paktën 8 karaktere')
    setLoading(true)
    try {
      await authApi.register(form)
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gabim gjatë regjistrimit')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
          <h2 className="mb-2">Kontrollo Emailin!</h2>
          <p className="text-gray-600">Kemi dërguar një link verifikimi në <strong>{form.email}</strong>. Kliko linkun për të aktivizuar llogarinë tënde.</p>
          <Link href="/login" className="btn-primary mt-6 inline-block">Shko te Hyrja</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Car className="text-blue-600" size={28} />
          <span className="text-2xl font-bold text-blue-600">AutoShqip</span>
        </div>

        <h2 className="text-center mb-6">Krijo Llogari Falas</h2>

        {refCode && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
            Kodi i referimit u aplikua! Do të marrësh 2.50€ kredit pas regjistrimit të mikut tënd.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Emri i plotë</label>
            <input className="input" value={form.name} onChange={set('name')} required minLength={2} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Telefoni (opsional)</label>
            <input type="tel" className="input" value={form.phone} onChange={set('phone')} placeholder="+355 69 ..." />
          </div>
          <div>
            <label className="label">Fjalëkalimi</label>
            <input type="password" className="input" value={form.password} onChange={set('password')} required minLength={8} />
            <p className="text-xs text-gray-500 mt-1">Të paktën 8 karaktere</p>
          </div>
          <div>
            <label className="label">Kodi i Referimit (opsional)</label>
            <input className="input" value={form.referralCode} onChange={set('referralCode')} placeholder="Vendos kodin nëse ke" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? 'Duke u regjistruar...' : 'Regjistrohu Falas'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Ke llogari?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Hyr këtu</Link>
        </p>
      </div>
    </div>
  )
}
