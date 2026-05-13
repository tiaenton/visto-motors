'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ListingCard } from '@/components/cars/ListingCard'
import { listingsApi } from '@/lib/api'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Car } from 'lucide-react'
import Link from 'next/link'

const MAKES = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Ford', 'Audi', 'Opel', 'Fiat', 'Renault', 'Peugeot', 'Honda', 'Skoda', 'Seat', 'Hyundai', 'Kia']
const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë']
const FUELS = [{ v: 'BENZINE', l: 'Benzinë' }, { v: 'DIESEL', l: 'Naftë' }, { v: 'ELEKTRIK', l: 'Elektrik' }, { v: 'HIBRID', l: 'Hibrid' }]
const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => String(new Date().getFullYear() - i))

function FilterPanel({ filters, setFilter, clearFilters, activeCount }: {
  filters: Record<string, string>
  setFilter: (k: string, v: string) => void
  clearFilters: () => void
  activeCount: number
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">Filtrat</span>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
            <X size={12} /> Pastro ({activeCount})
          </button>
        )}
      </div>

      {[
        { label: 'Marka', key: 'make', options: MAKES },
        { label: 'Qyteti', key: 'city', options: CITIES },
      ].map(({ label, key, options }) => (
        <div key={key}>
          <label className="label">{label}</label>
          <select className="input" value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}>
            <option value="">Të gjitha</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}

      <div>
        <label className="label">Karburanti</label>
        <select className="input" value={filters.fuelType} onChange={(e) => setFilter('fuelType', e.target.value)}>
          <option value="">Të gjitha</option>
          {FUELS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Transmisioni</label>
        <div className="grid grid-cols-2 gap-2">
          {[{ v: '', l: 'Të gjitha' }, { v: 'MANUAL', l: 'Manual' }, { v: 'AUTOMATIK', l: 'Automatik' }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setFilter('transmission', v)}
              className={`py-2 px-3 rounded-lg text-sm border font-medium transition-colors ${filters.transmission === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Çmimi (€)</label>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" className="input" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} />
          <input type="number" className="input" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Viti</label>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={filters.minYear} onChange={(e) => setFilter('minYear', e.target.value)}>
            <option value="">Nga</option>
            {YEARS.slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={filters.maxYear} onChange={(e) => setFilter('maxYear', e.target.value)}>
            <option value="">Deri</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

function CarsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
      const params: Record<string, any> = { ...filters, page, limit: 20 }
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
      const { data } = await listingsApi.getAll(params)
      setListings(data.data ?? [])
      setTotal(data.pagination?.total ?? 0)
    } catch { setListings([]); setTotal(0) }
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
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Makina të Përdorura</h1>
          {!loading && (
            <p className="text-gray-500 text-sm mt-0.5">
              {total.toLocaleString()} {total === 1 ? 'njoftim' : 'njoftime'}
              {activeFilterCount > 0 ? ' • filtrat aktive' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto text-sm"
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
          >
            <option value="newest">Më të reja</option>
            <option value="price_asc">Çmim ↑</option>
            <option value="price_desc">Çmim ↓</option>
            <option value="mileage_asc">Kilometrazh ↑</option>
          </select>
          {/* Mobile filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden btn-secondary text-sm gap-2"
          >
            <SlidersHorizontal size={15} />
            Filtrat
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="card p-5 sticky top-20">
            <FilterPanel filters={filters} setFilter={setFilter} clearFilters={clearFilters} activeCount={activeFilterCount} />
          </div>
        </aside>

        {/* Listings grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="h-48 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Car size={28} className="text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-1">Nuk u gjetën njoftime</p>
              <p className="text-gray-400 text-sm mb-5">Provo të ndryshosh ose pastrojsh filtrat</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-primary text-sm">
                  Pastro filtrat
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b flex items-center justify-between px-5 py-4">
              <span className="font-bold text-gray-900">Filtrat</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <FilterPanel filters={filters} setFilter={setFilter} clearFilters={clearFilters} activeCount={activeFilterCount} />
            </div>
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button onClick={() => setDrawerOpen(false)} className="btn-primary w-full py-3">
                Shiko {total.toLocaleString()} njoftime
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-gray-100" />)}
        </div>
      </div>
    }>
      <CarsContent />
    </Suspense>
  )
}
