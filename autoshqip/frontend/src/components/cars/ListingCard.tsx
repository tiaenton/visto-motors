import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Fuel, Gauge, Calendar, Star } from 'lucide-react'

interface Props {
  listing: any
}

const FUEL_LABELS: Record<string, string> = {
  BENZINE: 'Benzinë', DIESEL: 'Naftë', ELEKTRIK: 'Elektrik', HIBRID: 'Hibrid', GAS: 'Gaz',
}

export function ListingCard({ listing }: Props) {
  const image = listing.images?.[0]?.url || `https://placehold.co/400x300/e2e8f0/94a3b8?text=${encodeURIComponent(listing.make)}`

  return (
    <Link href={`/cars/${listing.id}`} className="card hover:shadow-md transition-shadow block group">
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <Image src={image} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        {listing.isFeatured && (
          <div className="absolute top-2 left-2 badge bg-amber-400 text-amber-900">
            <Star size={10} className="mr-1" /> Spikatur
          </div>
        )}
        {listing.status === 'SOLD' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">I SHITUR</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2">{listing.title}</h3>
          <span className="text-blue-600 font-bold text-lg ml-2 whitespace-nowrap">{listing.price.toLocaleString()}€</span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Calendar size={13} />{listing.year}</span>
          <span className="flex items-center gap-1"><Gauge size={13} />{listing.mileage.toLocaleString()} km</span>
          <span className="flex items-center gap-1"><Fuel size={13} />{FUEL_LABELS[listing.fuelType] || listing.fuelType}</span>
          <span className="flex items-center gap-1"><MapPin size={13} />{listing.city}</span>
        </div>
      </div>
    </Link>
  )
}
