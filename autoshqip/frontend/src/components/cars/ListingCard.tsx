import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Fuel, Gauge, Calendar, Zap, Star } from 'lucide-react'

interface Props {
  listing: any
}

const FUEL_LABELS: Record<string, string> = {
  BENZINE: 'Benzinë', DIESEL: 'Naftë', ELEKTRIK: 'Elektrik', HIBRID: 'Hibrid', GAS: 'Gaz',
}

export function ListingCard({ listing }: Props) {
  const image = listing.images?.[0]?.url ||
    `https://placehold.co/400x280/e2e8f0/94a3b8?text=${encodeURIComponent(listing.make ?? 'Auto')}`

  return (
    <Link
      href={`/cars/${listing.id}`}
      className="card hover:shadow-lg transition-all duration-200 block group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges overlay */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {listing.isFeatured && (
            <span className="badge bg-amber-400/95 text-amber-900 shadow-sm backdrop-blur-sm">
              <Star size={10} fill="currentColor" /> Spikatur
            </span>
          )}
        </div>

        {/* Sold overlay */}
        {listing.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-white text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full tracking-wide">
              I SHITUR
            </span>
          </div>
        )}

        {/* Price pill on image bottom-right */}
        <div className="absolute bottom-2.5 right-2.5">
          <span className="bg-white/95 backdrop-blur-sm text-blue-700 font-bold text-sm px-3 py-1 rounded-full shadow-sm">
            {(listing.price ?? 0).toLocaleString()} €
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-3">
          {listing.title}
        </h3>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} className="text-gray-400 flex-shrink-0" />
            {listing.year}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge size={12} className="text-gray-400 flex-shrink-0" />
            {(listing.mileage ?? 0).toLocaleString()} km
          </span>
          <span className="flex items-center gap-1.5">
            <Fuel size={12} className="text-gray-400 flex-shrink-0" />
            {FUEL_LABELS[listing.fuelType] ?? listing.fuelType}
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={12} className="text-gray-400 flex-shrink-0" />
            {listing.transmission === 'AUTOMATIK' ? 'Automatik' : 'Manual'}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-400">
          <MapPin size={11} className="flex-shrink-0" />
          {listing.city}
        </div>
      </div>
    </Link>
  )
}
