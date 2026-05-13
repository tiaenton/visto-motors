'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { listingsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Upload, X } from 'lucide-react'

const MAKES = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Ford', 'Audi', 'Opel', 'Fiat', 'Renault', 'Peugeot', 'Honda', 'Skoda', 'Seat', 'Hyundai', 'Kia', 'Tjetër']
const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë']

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '', make: '', model: '', variant: '', year: '', price: '',
    mileage: '', fuelType: 'BENZINE', transmission: 'MANUAL',
    engineSize: '', power: '', color: '', doors: '5', seats: '5',
    city: 'Tiranë', vin: '', description: '',
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      Array.from(files).forEach((f) => fd.append('images', f))
      const { data } = await listingsApi.uploadImages(fd)
      setUploadedUrls((prev) => [...prev, ...data.urls])
      toast.success(`${data.urls.length} foto u ngarkuan`)
    } catch {
      toast.error('Gabim gjatë ngarkimit të fotove')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (uploadedUrls.length === 0) return toast.error('Ngarko të paktën një foto')
    setLoading(true)
    try {
      const { data } = await listingsApi.create({ ...form, imageUrls: uploadedUrls })
      toast.success('Njoftimi u postua me sukses!')
      router.push(`/cars/${data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gabim gjatë postimit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="mb-2">Posto Njoftim</h1>
      <p className="text-gray-500 mb-8">Plotëso të dhënat e makinës tënde</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6">
          <h3 className="mb-4">Fotot</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Upload className="mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-600 mb-2">Tërhiq dhe lësho fotot këtu</p>
            <p className="text-sm text-gray-400 mb-4">PNG, JPG deri 10MB secila</p>
            <label className="btn-secondary cursor-pointer">
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImages} />
              {uploading ? 'Duke ngarkuar...' : 'Zgjidh Fotot'}
            </label>
          </div>
          {uploadedUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {uploadedUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} className="w-24 h-24 object-cover rounded-lg" alt="" />
                  <button type="button" onClick={() => setUploadedUrls((p) => p.filter((_, j) => j !== i))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-0.5 rounded-b-lg">Kryesorja</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="mb-2">Informacioni Bazë</h3>
          <div>
            <label className="label">Titulli i Njoftimit</label>
            <input className="input" value={form.title} onChange={set('title')} placeholder="p.sh. BMW Serie 3 2018" required minLength={5} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Marka</label>
              <select className="input" value={form.make} onChange={set('make')} required>
                <option value="">Zgjidh markën</option>
                {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Modeli</label>
              <input className="input" value={form.model} onChange={set('model')} placeholder="p.sh. Serie 3" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Viti</label>
              <input type="number" className="input" value={form.year} onChange={set('year')} placeholder="2018" min="1990" max="2025" required />
            </div>
            <div>
              <label className="label">Çmimi (€)</label>
              <input type="number" className="input" value={form.price} onChange={set('price')} placeholder="15000" required />
            </div>
            <div>
              <label className="label">Kilometrazhi</label>
              <input type="number" className="input" value={form.mileage} onChange={set('mileage')} placeholder="80000" required />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="mb-2">Detajet Teknike</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Karburanti</label>
              <select className="input" value={form.fuelType} onChange={set('fuelType')}>
                <option value="BENZINE">Benzinë</option>
                <option value="DIESEL">Naftë</option>
                <option value="ELEKTRIK">Elektrik</option>
                <option value="HIBRID">Hibrid</option>
                <option value="GAS">Gaz</option>
              </select>
            </div>
            <div>
              <label className="label">Transmisioni</label>
              <select className="input" value={form.transmission} onChange={set('transmission')}>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIK">Automatik</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cilindrata (L)</label>
              <input type="number" step="0.1" className="input" value={form.engineSize} onChange={set('engineSize')} placeholder="2.0" />
            </div>
            <div>
              <label className="label">Fuqia (CV)</label>
              <input type="number" className="input" value={form.power} onChange={set('power')} placeholder="150" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Ngjyra</label>
              <input className="input" value={form.color} onChange={set('color')} placeholder="E zezë" />
            </div>
            <div>
              <label className="label">Dyert</label>
              <select className="input" value={form.doors} onChange={set('doors')}>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="label">Vendet</label>
              <select className="input" value={form.seats} onChange={set('seats')}>
                {[2,4,5,6,7,8,9].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="mb-2">Vendndodhja & Përshkrimi</h3>
          <div>
            <label className="label">Qyteti</label>
            <select className="input" value={form.city} onChange={set('city')}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Kodi VIN (opsional)</label>
            <input className="input" value={form.vin} onChange={set('vin')} placeholder="WBA..." maxLength={17} />
          </div>
          <div>
            <label className="label">Përshkrimi</label>
            <textarea className="input h-32" value={form.description} onChange={set('description')} placeholder="Përshkruaj gjendjen, historinë dhe çdo detaj të rëndësishëm..." required minLength={20} />
          </div>
        </div>

        <button type="submit" disabled={loading || uploading} className="btn-primary w-full py-4 text-lg disabled:opacity-60">
          {loading ? 'Duke postuar...' : 'Posto Njoftimin'}
        </button>
      </form>
    </div>
  )
}
