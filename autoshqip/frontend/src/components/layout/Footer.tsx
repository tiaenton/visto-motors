import Link from 'next/link'
import { Car } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Car size={20} />
              AutoShqip
            </Link>
            <p className="text-sm leading-relaxed">
              Platforma nr.1 për blerjen dhe shitjen e makinave të përdorura në Shqipëri.
            </p>
          </div>

          {/* Blerës */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Blerës</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cars" className="hover:text-white transition-colors">Kërko Makina</Link></li>
              <li><Link href="/cars?fuelType=ELEKTRIK" className="hover:text-white transition-colors">Elektrike</Link></li>
              <li><Link href="/cars?sort=price_asc" className="hover:text-white transition-colors">Çmim i Ulët</Link></li>
            </ul>
          </div>

          {/* Shitës */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Shitës</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/cars/new" className="hover:text-white transition-colors">Posto Njoftim</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Planet dhe Çmimet</Link></li>
              <li><Link href="/dashboard/referral" className="hover:text-white transition-colors">Programi i Referimit</Link></li>
            </ul>
          </div>

          {/* Informacion */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Informacion</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">Krijo Llogari</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Hyr</Link></li>
              <li>
                <a href="mailto:hello@autoshqip.al" className="hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>© {new Date().getFullYear()} AutoShqip. Të gjitha të drejtat e rezervuara.</p>
          <p>Ndërtuar me ❤️ për Shqipërinë</p>
        </div>
      </div>
    </footer>
  )
}
