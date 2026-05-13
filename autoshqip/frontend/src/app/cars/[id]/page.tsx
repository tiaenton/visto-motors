'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { listingsApi, messagesApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Fuel, Gauge, Calendar, Phone, MessageCircle, Heart, Share2, CheckCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

const FUEL_LABELS: Record<string, string> = {
  BENZINE: 'Benzinë', DIESEL: 'Naftë', ELEKTRIK: 'Elektrik', HIBRID: 'Hibrid', GAS: 'Gaz',
}

export default function CarDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)

  useEffect(() => {
    listingsApi.getOne(id as string)
      .then((r) => { setListing(r.data); setSaved(r.data.isSaved) })
      .catch(() => toast.error('Njoftimi nuk u gjet'))
      .finally(() => setLoading(false))
  }, [id])

  async function toggleSave() {
    if (!user) return toast.error('Hyr për të ruajtur')
    try {
      if (saved) { await listingsApi.unsave(id as string); setSaved(false); toast('U hoq nga të ruajtura') }
      else { await listingsApi.save(id as string); setSaved(true); toast.success('U ruajt!') }
    } catch {}
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return toast.error('Hyr për të dërguar mesazh')
    if (!message.trim()) return
    setSending(true)
    try {
      await messagesApi.send({ listingId: id, receiverId: listing.user.id, content: message })
      setMsgSent(true)
      toast.success('Mesazhi u dërgua!')
    } catch {
      toast.error('Gabim. Provo përsëri.')
    } finally {
      setSending(false)
    }
  }

  function share() {
    navigator.share?.({ title: listing.title, url: window.location.href }) || navigator.clipboard.writeText(window.location.href)
    toast.success('Linku u kopjua!')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (!listing) return <div className="text-center py-20 text-gray-500">Njoftimi nuk u gjet</div>

  const images = listing.images || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative h-80 md:h-96 rounded-xl overflow-hidden mb-3">
            <Image src={images[imgIdx]?.url || `https://placehold.co/800x500/e2e8f0/94a3b8?text=${listing.make}`}
              alt={listing.title} fill className="object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 w-20 h-16 relative rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-blue-600' : 'border-transparent'}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="card p-6 mt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl">{listing.title}</h1>
                <p className="text-3xl font-bold text-blue-600 mt-1">{listing.price.toLocaleString()}€</p>
              </div>
              <div className="flex gap-2">
                <button onClick={toggleSave} className={`p-2 rounded-lg border transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
                </button>
                <button onClick={share} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-6 pb-6 border-b">
              <span className="flex items-center gap-1"><Calendar size={14} />{listing.year}</span>
              <span className="flex items-center gap-1"><Gauge size={14} />{listing.mileage.toLocaleString()} km</span>
              <span className="flex items-center gap-1"><Fuel size={14} />{FUEL_LABELS[listing.fuelType]}</span>
              <span className="flex items-center gap-1"><MapPin size={14} />{listing.city}</span>
              {listing.transmission && <span className="flex items-center gap-1"><Zap size={14} />{listing.transmission === 'AUTOMATIK' ? 'Automatik' : 'Manual'}</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 pb-6 border-b text-sm">
              {[
                ['Marka', listing.make], ['Modeli', listing.model],
                listing.engineSize && ['Cilindrata', `${listing.engineSize}L`],
                listing.power && ['Fuqia', `${listing.power} CV`],
                listing.color && ['Ngjyra', listing.color],
                listing.doors && ['Dyert', listing.doors],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-gray-500">{k}</p>
                  <p className="font-medium mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            <h3 className="mb-3">Përshkrimi</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                {listing.user.name[0]}
              </div>
              <div>
                <p className="font-semibold">{listing.user.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12} />{listing.user.city || listing.city}</p>
              </div>
            </div>

            {listing.user.phone && (
              <a href={`tel:${listing.user.phone}`} className="flex items-center justify-center gap-2 w-full btn-primary mb-3 py-3">
                <Phone size={18} /> {listing.user.phone}
              </a>
            )}

            <a href={`https://wa.me/${listing.user.phone?.replace(/\D/g, '')}?text=Përshëndetje! Jam i interesuar për makinën tuaj: ${listing.title}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors mb-4">
              <MessageCircle size={18} /> WhatsApp
            </a>

            {!msgSent ? (
              <form onSubmit={sendMessage}>
                <textarea className="input h-24 mb-2 resize-none text-sm" value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Shkruaj një mesazh..." />
                <button type="submit" disabled={sending} className="btn-secondary w-full disabled:opacity-60">
                  {sending ? 'Duke dërguar...' : 'Dërgo Mesazh'}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-700 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Mesazhi u dërgua!
              </div>
            )}
          </div>

          <div className="card p-4 text-sm text-gray-500 text-center">
            <p>Postuar: {new Date(listing.createdAt).toLocaleDateString('sq-AL')}</p>
            <p>Shikime: {listing.views}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
