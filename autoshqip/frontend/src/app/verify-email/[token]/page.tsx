'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    api.get(`/api/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <h2 className="mb-2">Email u Verifikua!</h2>
            <p className="text-gray-600 mb-6">Llogaria jote është aktive. Mund të hysh tani.</p>
            <Link href="/login" className="btn-primary inline-block">Hyr në Llogari</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="text-red-500 mx-auto mb-4" size={48} />
            <h2 className="mb-2">Linku ka Skaduar</h2>
            <p className="text-gray-600 mb-6">Ky link verifikimi është i pavlefshëm ose ka skaduar.</p>
            <Link href="/register" className="btn-primary inline-block">Regjistrohu Sërish</Link>
          </>
        )}
      </div>
    </div>
  )
}
