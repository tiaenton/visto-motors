'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Shield, TrendingUp, Star, ArrowRight, CheckCircle } from 'lucide-react'
import { ListingCard } from '@/components/cars/ListingCard'
import { listingsApi } from '@/lib/api'
import Link from 'next/link'

const MAKES = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Audi', 'Opel', 'Ford', 'Fiat', 'Renault', 'Peugeot', 'Honda', 'Hyundai']
const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat']

const BRAND_COLORS: Record<string, string> = {
  BMW: 'bg-blue-50 hover:bg-blue-100 text-blue-800',
  Mercedes: 'bg-gray-50 hover:bg-gray-100 text-gray-800',
  Volkswagen: 'bg-sky-50 hover:bg-sky-100 text-sky-800',
  Toyota: 'bg-red-50 hover:bg-red-100 text-red-800',
  Audi: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800',
  Opel: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800',
  Ford: 'bg-blue-50 hover:bg-blue-100 text-blue-900',
  Fiat: 'bg-red-50 hover:bg-red-100 text-red-900',
  Renault: 'bg-amber-50 hover:bg-amber-100 text-amber-800',
  Peugeot: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800',
  Honda: 'bg-rose-50 hover:bg-rose-100 text-rose-800',
  Hyundai: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
}

function useFeatured() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    listingsApi.getAll({ limit: '6', sort: 'newest' })
      .then((r) => setData(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  return { data, loading }
}

function useStats() {
  const [stats, setStats] = useState({ total: 0, active: 0 })
  useEffect(() => {
    listingsApi.getAll({ limit: '1' })
      .then((r) => setStats({ total: r.data.pagination?.total ?? 0, active: r.data.pagination?.total ?? 0 }))
      .catch(() => {})
  }, [])
  return stats
}

export default function HomePage() {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [city, setCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const { data: featured, loading } = useFeatured()
  const stats = useStats()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (make) params.set('make', make)
    if (city) params.set('city', city)
    if (maxPrice) params.set('maxPrice', maxPrice)
    router.push(`/cars?${params.toString()}`)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.04%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-200 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {stats.active > 0 ? `${stats.active.toLocaleString()} makina aktive` : 'Platforma nr.1 në Shqipëri'}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Gjej Makinën Tënde<br />
              <span className="text-blue-300">të Ëndrrave</span>
            </h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
              Mijëra makina nga dealerë të verifikuar në të gjithë Shqipërinë.
              Çmime reale, foto të cilësisë së lartë.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur rounded-2xl p-4 md:p-5 shadow-2xl max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="label text-gray-600 text-xs uppercase tracking-wide">Marka</label>
                <select className="input" value={make} onChange={(e) => setMake(e.target.value)}>
                  <option value="">Të gjitha markat</option>
                  {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-gray-600 text-xs uppercase tracking-wide">Qyteti</label>
                <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Të gjitha qytetet</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-gray-600 text-xs uppercase tracking-wide">Çmimi max (€)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="p.sh. 15 000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-base gap-2">
              <Search size={18} />
              Kërko Makina
            </button>
          </form>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: Shield, color: 'text-blue-600 bg-blue-50', title: 'Dealerë të Verifikuar', desc: 'Çdo dealer verifikohet manualisht nga ekipi ynë' },
            { icon: TrendingUp, color: 'text-green-600 bg-green-50', title: 'Çmime Reale', desc: 'Njoftime me çmime të drejta dhe transparente' },
            { icon: Star, color: 'text-amber-600 bg-amber-50', title: 'Foto Profesionale', desc: 'Imazhe të cilësisë së lartë për çdo njoftim' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="text-gray-500 text-sm mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by brand ── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Kërko sipas Markës</h2>
            <Link href="/cars" className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
              Të gjitha <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {MAKES.map((brand) => (
              <button
                key={brand}
                onClick={() => router.push(`/cars?make=${brand}`)}
                className={`rounded-xl py-3 px-2 text-sm font-semibold transition-all duration-150 border border-transparent hover:border-current hover:shadow-sm ${BRAND_COLORS[brand] ?? 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Njoftime të Fundit</h2>
              <p className="text-gray-500 text-sm mt-1">Makina të shtuara kohët e fundit</p>
            </div>
            <Link href="/cars" className="btn-secondary text-sm gap-1.5 hidden sm:inline-flex">
              Shiko të gjitha <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Nuk ka njoftime aktive ende.</p>
              <Link href="/cars/new" className="btn-primary mt-4">Posto i pari</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link href="/cars" className="btn-secondary gap-1.5">
              Shiko të gjitha <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-14 px-4 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Si Funksionon AutoShqip</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Krijo Llogari', desc: 'Regjistrohu falas dhe zgjidh planin që të përshtatet.' },
              { step: '2', title: 'Posto Njoftimin', desc: 'Ngarko fotot, plotëso detajet dhe njoftimi shfaqet menjëherë.' },
              { step: '3', title: 'Merr Thirrje', desc: 'Blerësit të kontaktojnë direkt me telefon ose WhatsApp.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-md">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{title}</p>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Sill Makinën Tënde në AutoShqip</h2>
          <p className="text-blue-100 mb-6 text-lg">Posto sot. Nga 5€/muaj. Anulo kur të duash.</p>
          <ul className="flex flex-col sm:flex-row gap-3 justify-center text-sm text-blue-100 mb-8">
            {['Deri 10 njoftime aktive', 'Foto të pakufizuara', 'Insignë dealer i verifikuar'].map((f) => (
              <li key={f} className="flex items-center justify-center gap-2">
                <CheckCircle size={15} className="text-blue-300 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">
              Regjistrohu Falas
            </Link>
            <Link href="/pricing" className="border border-white/50 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Shiko Çmimet
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
