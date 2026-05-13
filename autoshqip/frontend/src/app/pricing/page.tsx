'use client'
import { useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { paymentsApi } from '@/lib/api'
import toast from 'react-hot-toast'

const plans = [
  {
    name: 'Privat',
    price: 3,
    desc: 'Për shitës privatë',
    features: ['1 njoftim aktiv', 'Fotografi deri 10', 'WhatsApp direktë', 'Listim 30 ditë'],
    cta: 'Fillo Falas',
    plan: null as null | 'basic' | 'premium',
    href: '/register',
    featured: false,
  },
  {
    name: 'Dealer',
    price: 5,
    desc: 'Për dealerë të vegjël',
    features: ['Deri 10 njoftime aktive', 'Fotografi deri 20 / njoftim', 'Insignë dealer i verifikuar', 'Listim 30 ditë', 'Statistika bazë', 'WhatsApp direktë'],
    cta: 'Fillo Tani',
    plan: 'basic' as const,
    href: null,
    featured: true,
  },
  {
    name: 'Premium',
    price: 15,
    desc: 'Për dealerë të mëdhenj',
    features: ['Njoftime të pakufizuara', 'Fotografi të pakufizuara', '1 njoftim i spikatur / muaj falas', 'Statistika të avancuara', 'Prioritet në rezultate', 'Insignë premium'],
    cta: 'Abonohu Tani',
    plan: 'premium' as const,
    href: null,
    featured: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(plan: 'basic' | 'premium', planName: string) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      router.push('/register')
      return
    }

    setLoading(planName)
    try {
      const { data } = await paymentsApi.createCheckout(plan)
      window.location.href = data.checkoutUrl
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ndodhi një gabim'
      toast.error(msg)
      if (err.response?.status === 401) router.push('/login')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="mb-4">Çmimet Tona</h1>
        <p className="text-gray-600 text-lg">Transparent. Pa kontrata. Anulo kur të duash.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={`card p-8 flex flex-col ${plan.featured ? 'ring-2 ring-blue-600 relative' : ''}`}>
            {plan.featured && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">Më i popullarit</span>
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-xl mb-1">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}€</span>
                <span className="text-gray-500">/muaj</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {plan.plan ? (
              <button
                onClick={() => handleCheckout(plan.plan!, plan.name)}
                disabled={loading === plan.name}
                className={`${plan.featured ? 'btn-primary' : 'btn-secondary'} text-center py-3 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading === plan.name ? 'Duke u ngarkuar...' : plan.cta}
              </button>
            ) : (
              <Link href={plan.href!} className="btn-secondary text-center py-3">
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h3 className="mb-4">Shërbime Shtesë</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { name: 'Boost 7 ditë', price: '3.50€', desc: 'Njoftimi yt shfaqet i pari' },
            { name: 'Raport VIN', price: '4€', desc: 'Historia e plotë e makinës' },
            { name: 'Fotografi Pro', price: 'Falas*', desc: 'Sesion foto falas për 20 dealerët e parë' },
          ].map((s) => (
            <div key={s.name} className="card p-5">
              <p className="font-semibold">{s.name}</p>
              <p className="text-2xl font-bold text-blue-600 my-2">{s.price}</p>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">
        Pagesa procesohet nga Stripe — karta jote është e sigurt.
      </p>
    </div>
  )
}
