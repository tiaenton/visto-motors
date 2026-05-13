'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ListingCard } from '@/components/cars/ListingCard'
import { listingsApi } from '@/lib/api'
import { SlidersHorizontal, X } from 'lucide-react'

const MAKES = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Ford', 'Audi', 'Opel', 'Fiat', 'Renault', 'Peugeot', 'Honda', 'Skoda', 'Seat', 'Hyundai', 'Kia']
const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë']
const FUELS = [{ v: 'BENZINE', l: 'Benzinë' }, { v: 'DIESEL', l: 'Naftë' }, { v: 'ELEKTRIK', l: 'Elektrik' }, { v: 'HIBRID', l: 'Hibrid' }]

export default function CarsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    make: searchParams.get('make') || '',
    city: searchParams.get('city') || '',
    fuelType: searchParams.get('fuelType') || '',
    transmission: searchParams.get('transmission') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minYear: searchParams.get('minYear') || '',
    maxYear: searchParams.get('maxYear') || '',
    sort: 'newest',
  })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, limit: 20 }
      Object.keys(params).forEach((k) => !(params as any)[k] && delete (params as any)[k])
      const { data } = await listingsApi.getAll(params)
      setListings(data.data)
      setTotal(data.pagination.total)
    } catch {}
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { fetchListings() }, [fetchListings])

  function setFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function clearFilters() {
    setFilters({ make: '', city: '', fuelType: '', transmission: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', sort: 'newest' })
    setPage(1)
  }

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'sort' && v).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Makina të Përdorura</h1>
          {!loading && <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} njoftime</p>}
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
            <option value="newest">Më të reja</option>
            <option value="price_asc">Çmim: ulët → lartë</option>
            <option value="price_desc">Çmim: lartë → ulët</option>
            <option value="mileage_asc">Kilometrazh: ulët</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Filtrat {activeFilterCount > 0 && <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filtrat</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-red-600 flex items-center gap-1 hover:underline">
                <X size={14} /> Pastro filtrat
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Marka</label>
              <select className="input" value={filters.make} onChange={(e) => setFilter('make', e.target.value)}>
                <option value="">Të gjitha</option>
                {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qyteti</label>
              <select className="input" value={filters.city} onChange={(e) => setFilter('city', e.target.value)}>
                <option value="">Të gjitha</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Karburanti</label>
              <select className="input" value={filters.fuelType} onChange={(e) => setFilter('fuelType', e.target.value)}>
                <option value="">Të gjitha</option>
                {FUELS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Transmisioni</label>
              <select className="input" value={filters.transmission} onChange={(e) => setFilter('transmission', e.target.value)}>
                <option value="">Të gjitha</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIK">Automatik</option>
              </select>
            </div>
            <div>
              <label className="label">Çmimi min (€)</label>
              <input type="number" className="input" placeholder="0" value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
            </div>
            <div>
              <label className="label">Çmimi max (€)</label>
              <input type="number" className="input" placeholder="50000" value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
            </div>
            <div>
              <label className="label">Viti min</label>
              <input type="number" className="input" placeholder="2000" value={filters.minYear} onChange={(e) => setFilter('minYear', e.target.value)} />
            </div>
            <div>
              <label className="label">Viti max</label>
              <input type="number" className="input" placeholder={String(new Date().getFullYear())} value={filters.maxYear} onChange={(e) => setFilter('maxYear', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-100" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-xl mb-2">Nuk u gjetën njoftime</p>
          <p className="text-sm">Provo të ndryshosh filtrat</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>

          {total > 20 && (
            <div className="flex justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">← Para</button>
              <span className="flex items-center px-4 text-sm text-gray-600">Faqe {page} nga {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-secondary disabled:opacity-40">Tjetër →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
