'use client'
import { useEffect, useState, useRef } from 'react'
import { messagesApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send, ArrowLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [showThread, setShowThread] = useState(false) // mobile toggle
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    messagesApi.getConversations().then((r) => setConversations(r.data))
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function openConversation(conv: any) {
    setSelected(conv)
    setShowThread(true)
    const otherId = conv.senderId === user?.id ? conv.receiverId : conv.senderId
    const msgs = await messagesApi.getMessages(conv.listingId, otherId)
    setMessages(msgs.data)
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault()
    if (!newMsg.trim() || !selected) return
    setSending(true)
    try {
      const otherId = selected.senderId === user?.id ? selected.receiverId : selected.senderId
      const { data } = await messagesApi.send({ listingId: selected.listingId, receiverId: otherId, content: newMsg })
      setMessages((p) => [...p, data])
      setNewMsg('')
    } catch { toast.error('Gabim. Provo përsëri.') }
    finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  const ConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">Mesazhet</h1>
        {conversations.length > 0 && (
          <p className="text-sm text-gray-500 mt-0.5">{conversations.length} biseda</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <MessageCircle size={36} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Nuk ke asnjë bisedë ende</p>
            <p className="text-sm mt-1">Kontakto një shitës nga njoftimet</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = conv.senderId === user?.id ? conv.receiver : conv.sender
            const isSelected = selected?.id === conv.id
            return (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3.5 border-b hover:bg-gray-50 transition-colors flex items-center gap-3 ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {other?.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{other?.name}</p>
                    {!conv.isRead && conv.receiverId === user?.id && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-blue-600 truncate mt-0.5">{conv.listing?.title}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.content}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0 lg:hidden" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  const ThreadView = () => {
    if (!selected) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircle size={44} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-400">Zgjidh një bisedë</p>
            <p className="text-sm mt-1 text-gray-300">nga lista në të majtë</p>
          </div>
        </div>
      )
    }

    const other = selected.senderId === user?.id ? selected.receiver : selected.sender

    return (
      <div className="flex flex-col h-full">
        {/* Thread header */}
        <div className="px-4 py-3.5 border-b bg-white flex items-center gap-3">
          <button onClick={() => setShowThread(false)} className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
            {other?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 truncate">{other?.name}</p>
            <p className="text-xs text-blue-600 truncate">{selected.listing?.title}</p>
          </div>
          {selected.listing?.images?.[0] && (
            <div className="ml-auto w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={selected.listing.images[0].url} alt="" width={40} height={40} className="object-cover w-full h-full" />
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50">
          {messages.map((msg) => {
            const isMe = msg.senderId === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100'}`}>
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                    {new Date(msg.createdAt).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMsg} className="px-4 py-3 border-t bg-white flex gap-2">
          <input
            className="input flex-1 text-sm"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Shkruaj mesazhin..."
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={sending || !newMsg.trim()}
            className="btn-primary px-4 disabled:opacity-50 flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
      <div className="card overflow-hidden" style={{ height: 'calc(100dvh - 140px)', minHeight: '500px', display: 'flex' }}>
        {/* Conversation list — always shown on desktop, hidden on mobile when thread is open */}
        <div className={`${showThread ? 'hidden' : 'flex'} lg:flex w-full lg:w-72 xl:w-80 border-r flex-shrink-0 flex-col`}>
          <ConversationList />
        </div>

        {/* Thread — hidden on mobile until a conversation is selected */}
        <div className={`${showThread ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-w-0`}>
          <ThreadView />
        </div>
      </div>
    </div>
  )
}
