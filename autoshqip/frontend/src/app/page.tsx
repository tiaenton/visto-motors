'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, Shield, Star } from 'lucide-react'
import { ListingCard } from '@/components/cars/ListingCard'
import { listingsApi } from '@/lib/api'

const MAKES = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Ford', 'Audi', 'Opel', 'Fiat', 'Renault', 'Peugeot']
const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat']

function useFeatured() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listingsApi.getAll({ featured: 'true', limit: '6' })
      .then((r) => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export default function HomePage() {
  const router = useRouter()
  const [make, setMake] = useState('')
  const [city, setCity] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const { data: featured, loading } = useFeatured()

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
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Gjeni Makinën Tuaj të Ëndrrave
          </h1>
          <p className="text-blue-100 text-xl mb-10">
            Mijëra makina nga dealerë të verifikuar në të gjithë Shqipërinë
          </p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 md:p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label text-gray-700">Marka</label>
                <select className="input" value={make} onChange={(e) => setMake(e.target.value)}>
                  <option value="">Të gjitha markat</option>
                  {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-gray-700">Qyteti</label>
                <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Të gjitha qytetet</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-gray-700">Çmimi max (€)</label>
                <input type="number" className="input" placeholder="p.sh. 10000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2">
              <Search size={20} />
              Kërko Makina
            </button>
          </form>
        </div>
      </section>

      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold">Dealerë të Verifikuar</h3>
            <p className="text-gray-500 text-sm">Çdo dealer verifikohet manualisht nga ekipi ynë</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold">Çmime Reale</h3>
            <p className="text-gray-500 text-sm">Njoftime me çmime të drejta të tregut shqiptar</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Star className="text-amber-600" size={24} />
            </div>
            <h3 className="font-semibold">Foto të Cilësisë së Lartë</h3>
            <p className="text-gray-500 text-sm">Fotografi profesionale për çdo listim</p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2>Njoftime të Spikatura</h2>
          <a href="/cars" className="text-blue-600 hover:underline font-medium">Shiko të gjitha →</a>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Sill Makinën Tënde në AutoShqip</h2>
          <p className="text-blue-100 mb-8">Posto njoftimin tënd sot. 5€/muaj. Anulo kur të duash.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors">
              Regjistrohu Falas
            </a>
            <a href="/pricing" className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Shiko Çmimet
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
