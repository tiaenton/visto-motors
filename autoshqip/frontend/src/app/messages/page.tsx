'use client'
import { useEffect, useState } from 'react'
import { messagesApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading])

  useEffect(() => {
    if (!user) return
    messagesApi.getConversations().then((r) => setConversations(r.data))
  }, [user])

  async function openConversation(conv: any) {
    setSelected(conv)
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
    } catch { toast.error('Gabim') }
    finally { setSending(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="mb-6">Mesazhet</h1>
      <div className="card overflow-hidden" style={{ height: '70vh', display: 'flex' }}>
        <div className="w-80 border-r flex-shrink-0 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <MessageCircle size={32} className="mb-2" />
              <p className="text-sm">Nuk ke asnjë bisedë ende</p>
            </div>
          ) : conversations.map((conv) => {
            const other = conv.senderId === user?.id ? conv.receiver : conv.sender
            const isSelected = selected?.id === conv.id
            return (
              <button key={conv.id} onClick={() => openConversation(conv)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {other?.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{other?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.listing?.title}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{conv.content}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex-1 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle size={40} className="mx-auto mb-2" />
                <p>Zgjidh një bisedë</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b bg-gray-50">
                <p className="font-medium">{selected.listing?.title}</p>
                <p className="text-sm text-gray-500">
                  {selected.senderId === user?.id ? selected.receiver?.name : selected.sender?.name}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <form onSubmit={sendMsg} className="p-4 border-t flex gap-2">
                <input className="input flex-1" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Shkruaj mesazhin..." />
                <button type="submit" disabled={sending} className="btn-primary px-4 disabled:opacity-60">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
