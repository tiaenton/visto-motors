'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { listingsApi, paymentsApi } from '@/lib/api'
import { ListingCard } from '@/components/cars/ListingCard'
import { Plus, CreditCard, Users, Car, Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast.success('Abonimi u aktivizua me sukses!')
      router.replace('/dashboard')
    }
    if (searchParams.get('boost') === 'success') {
      toast.success('Boost u aktivizua me sukses!')
      router.replace('/dashboard')
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return
    Promise.all([
      listingsApi.getMy().then((r) => setListings(r.data)),
      paymentsApi.getSubscription().then((r) => setSubscription(r.data)),
    ]).finally(() => setLoadingData(false))
  }, [user])

  async function handlePortal() {
    try {
      const { data } = await paymentsApi.getPortalUrl()
      window.location.href = data.url
    } catch {
      toast.error('Gabim. Provo përsëri.')
    }
  }

  if (loading || loadingData) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  }

  if (!user) return null

  const activeListings = listings.filter((l) => l.status === 'ACTIVE').length
  const soldListings = listings.filter((l) => l.status === 'SOLD').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Mirë se vjen, {user.name}!</h1>
          <p className="text-gray-500 mt-1">Menaxho njoftimet dhe abonimin tënd</p>
        </div>
        <Link href="/cars/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Posto Njoftim
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Njoftime Aktive', value: activeListings, icon: Car, color: 'blue' },
          { label: 'Të Shituara', value: soldListings, icon: Star, color: 'green' },
          { label: 'Kredite', value: `${user.creditBalance.toFixed(2)}€`, icon: CreditCard, color: 'amber' },
          { label: 'Abonimi', value: subscription?.status === 'ACTIVE' ? 'Aktiv' : 'Pa abonim', icon: Users, color: subscription?.status === 'ACTIVE' ? 'green' : 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-${color}-100`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3>Abonimenti</h3>
          {subscription?.status === 'ACTIVE' && (
            <button onClick={handlePortal} className="btn-secondary text-sm">Menaxho Abonimin</button>
          )}
        </div>
        {subscription?.status === 'ACTIVE' ? (
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <p className="font-medium">Plan {subscription.plan} — Aktiv</p>
              <p className="text-sm text-gray-500">Rinovohet: {new Date(subscription.currentPeriodEnd).toLocaleDateString('sq-AL')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Nuk ke abonim aktiv. Ndrysho planin për të postuar njoftime.</p>
            <Link href="/pricing" className="btn-primary">Shiko Çmimet</Link>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3>Njoftimet e Mia ({listings.length})</h3>
          <div className="flex gap-2">
            <Link href="/dashboard/referral" className="btn-secondary text-sm">Referalët & Kreditet</Link>
          </div>
        </div>
        {listings.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            <Car size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Nuk ke asnjë njoftim ende.</p>
            <Link href="/cars/new" className="btn-primary mt-4 inline-block">Posto Njoftimin e Parë</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  )
}
