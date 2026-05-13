'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Users, Car, Euro, TrendingUp, CheckCircle, XCircle, Trash2 } from 'lucide-react'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [tab, setTab] = useState<'listings' | 'users'>('listings')
  const [listings, setListings] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/')
  }, [user, loading])

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return
    Promise.all([
      api.get('/api/admin/stats').then((r) => setStats(r.data)),
      api.get('/api/admin/listings').then((r) => setListings(r.data.data)),
      api.get('/api/admin/users').then((r) => setUsers(r.data.data)),
    ]).finally(() => setLoadingData(false))
  }, [user])

  async function approveListing(id: string) {
    await api.patch(`/api/admin/listings/${id}`, { status: 'ACTIVE' })
    setListings((p) => p.map((l) => l.id === id ? { ...l, status: 'ACTIVE' } : l))
    toast.success('Njoftimi u aprovua')
  }

  async function rejectListing(id: string) {
    await api.patch(`/api/admin/listings/${id}`, { status: 'REJECTED' })
    setListings((p) => p.map((l) => l.id === id ? { ...l, status: 'REJECTED' } : l))
    toast.success('Njoftimi u refuzua')
  }

  async function deleteListing(id: string) {
    if (!confirm('Fshi njoftimin?')) return
    await api.delete(`/api/admin/listings/${id}`)
    setListings((p) => p.filter((l) => l.id !== id))
    toast.success('U fshi')
  }

  async function toggleVerify(id: string, current: boolean) {
    await api.patch(`/api/admin/users/${id}`, { isVerified: !current })
    setUsers((p) => p.map((u) => u.id === id ? { ...u, isVerified: !current } : u))
    toast.success(current ? 'Verifikimi u hoq' : 'Përdoruesi u verifikua')
  }

  if (loading || loadingData) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="mb-8">Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Përdorues', value: stats.users, icon: Users },
            { label: 'Njoftime', value: stats.listings, icon: Car },
            { label: 'Aktive', value: stats.activeListings, icon: TrendingUp },
            { label: 'Të ardhura/muaj', value: `${stats.monthlyRevenue}€`, icon: Euro },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="card p-5">
              <Icon size={20} className="text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('listings')} className={tab === 'listings' ? 'btn-primary' : 'btn-secondary'}>Njoftime</button>
        <button onClick={() => setTab('users')} className={tab === 'users' ? 'btn-primary' : 'btn-secondary'}>Përdorues</button>
      </div>

      {tab === 'listings' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Njoftimi</th>
                  <th className="text-left p-4 font-medium text-gray-600">Shitësi</th>
                  <th className="text-left p-4 font-medium text-gray-600">Çmimi</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statusi</th>
                  <th className="text-left p-4 font-medium text-gray-600">Data</th>
                  <th className="text-left p-4 font-medium text-gray-600">Veprime</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {l.images?.[0] && <img src={l.images[0].url} className="w-12 h-10 object-cover rounded" alt="" />}
                        <div>
                          <p className="font-medium">{l.title}</p>
                          <p className="text-gray-500 text-xs">{l.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p>{l.user?.name}</p>
                      <p className="text-gray-500 text-xs">{l.user?.email}</p>
                    </td>
                    <td className="p-4 font-medium">{l.price.toLocaleString()}€</td>
                    <td className="p-4">
                      <span className={`badge ${
                        l.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        l.status === 'SOLD' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{l.status}</span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(l.createdAt).toLocaleDateString('sq-AL')}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {l.status !== 'ACTIVE' && (
                          <button onClick={() => approveListing(l.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprovo">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {l.status === 'ACTIVE' && (
                          <button onClick={() => rejectListing(l.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Refuzo">
                            <XCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => deleteListing(l.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Fshi">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Përdoruesi</th>
                  <th className="text-left p-4 font-medium text-gray-600">Roli</th>
                  <th className="text-left p-4 font-medium text-gray-600">Njoftime</th>
                  <th className="text-left p-4 font-medium text-gray-600">Verifikuar</th>
                  <th className="text-left p-4 font-medium text-gray-600">Data</th>
                  <th className="text-left p-4 font-medium text-gray-600">Veprime</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'DEALER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">{u._count?.listings ?? 0}</td>
                    <td className="p-4">
                      {u.isVerified
                        ? <CheckCircle size={16} className="text-green-500" />
                        : <XCircle size={16} className="text-gray-300" />}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('sq-AL')}</td>
                    <td className="p-4">
                      <button onClick={() => toggleVerify(u.id, u.isVerified)}
                        className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                        {u.isVerified ? 'Hiq Verif.' : 'Verifiko'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
