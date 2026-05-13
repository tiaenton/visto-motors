'use client'
import { useEffect, useState } from 'react'
import { referralApi } from '@/lib/api'
import { Copy, Users, Euro, Share2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const [stats, setStats] = useState<any>(null)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      referralApi.getStats().then((r) => setStats(r.data)),
      referralApi.getLink().then((r) => setLink(r.data.link)),
    ]).finally(() => setLoading(false))
  }, [])

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Linku u kopjua!')
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const text = `Regjistrohu në AutoShqip — platformën nr.1 të makinave në Shqipëri! ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="mb-2">Programi i Referimit</h1>
      <p className="text-gray-600 mb-8">Fto miqtë dhe fito 2.50€ kredit për çdo regjistrim të verifikuar</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Referime gjithsej', value: stats?.totalReferrals ?? 0, icon: Users },
          { label: 'Fituar gjithsej', value: `${(stats?.totalEarned ?? 0).toFixed(2)}€`, icon: Euro },
          { label: 'Balanca kredite', value: `${(stats?.creditBalance ?? 0).toFixed(2)}€`, icon: Euro },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5 text-center">
            <Icon size={24} className="text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="mb-4">Linku i Referimit Tënd</h3>
        <div className="flex gap-2 mb-4">
          <input readOnly className="input bg-gray-50 flex-1 text-sm" value={link} />
          <button onClick={copy} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Kopjuar!' : 'Kopjo'}
          </button>
        </div>
        <button onClick={shareWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
          <Share2 size={18} />
          Shpërnda në WhatsApp
        </button>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="mb-4">Si Funksionon</h3>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Kopjo linkun e referimit tënd' },
            { step: '2', text: 'Shpërnda te miqtë dhe familjarët' },
            { step: '3', text: 'Kur ata regjistrohen dhe verifikojnë emailin, ti fiton 2.50€ kredit' },
            { step: '4', text: 'Përdor kreditet për të boostuar njoftimet tuaja' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{step}</div>
              <p className="text-gray-700 pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {stats?.transactions?.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4">Historia e Krediteve</h3>
          <div className="space-y-3">
            {stats.transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString('sq-AL')}</p>
                </div>
                <span className={`font-semibold ${t.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
