'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Inbox, SendHorizonal, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

interface Message {
  id: number
  sender_id: number
  recipient_id: number
  subject: string
  content: string
  is_read: boolean
  created_at: string
  sender?: { first_name: string; last_name: string; email: string }
  recipient?: { first_name: string; last_name: string; email: string }
}

type Tab = 'inbox' | 'sent' | 'compose'

export default function MessagesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('inbox')
  const [inbox, setInbox] = useState<Message[]>([])
  const [sent, setSent] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ recipient_email: '', subject: '', content: '' })
  const [sending, setSending] = useState(false)

  const fetchMessages = async () => {
    try {
      const [inRes, sentRes] = await Promise.all([
        api.get('/announcements/messages/inbox'),
        api.get('/announcements/messages/sent'),
      ])
      setInbox(inRes.data.items || inRes.data || [])
      setSent(sentRes.data.items || sentRes.data || [])
    } catch { toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMessages() }, [])

  const handleRead = async (msg: Message) => {
    setSelected(msg)
    if (!msg.is_read && tab === 'inbox') {
      try {
        await api.put(`/announcements/messages/${msg.id}/read`)
        setInbox(prev => prev.map(m => m.id === msg.id ? {...m, is_read: true} : m))
      } catch {}
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      // Resolve email → user id
      const usersRes = await api.get('/users', { params: { search: form.recipient_email, per_page: 5 } })
      const match = (usersRes.data.items || []).find(
        (u: any) => u.email.toLowerCase() === form.recipient_email.toLowerCase()
      )
      if (!match) {
        toast.error('Aucun utilisateur trouvé avec cet email')
        setSending(false)
        return
      }
      await api.post('/announcements/messages', {
        recipient_id: match.id,
        subject: form.subject,
        content: form.content,
      })
      toast.success('Message envoyé !')
      setForm({ recipient_email: '', subject: '', content: '' })
      setTab('sent')
      fetchMessages()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de l\'envoi')
    } finally { setSending(false) }
  }

  if (loading) return <PageLoader />

  const messages = tab === 'inbox' ? inbox : sent
  const filtered = messages.filter(m => {
    const q = search.toLowerCase()
    return !q || m.subject.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-0.5">Messagerie interne</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Left pane */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { key: 'inbox', label: 'Reçus', icon: Inbox, count: inbox.filter(m => !m.is_read).length },
              { key: 'sent', label: 'Envoyés', icon: SendHorizonal, count: 0 },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSelected(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === key ? 'text-primary-700 border-b-2 border-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">{count}</span>}
              </button>
            ))}
          </div>

          {/* Compose button */}
          <button
            onClick={() => { setTab('compose'); setSelected(null) }}
            className={`mx-3 mt-3 flex items-center gap-2 justify-center py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'compose' ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
          >
            <Send className="w-3.5 h-3.5" />Nouveau message
          </button>

          {/* Search */}
          {tab !== 'compose' && (
            <div className="relative mx-3 mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto mt-2 px-1">
            {tab === 'compose' ? null : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Aucun message</div>
            ) : (
              filtered.map(m => {
                const person = tab === 'inbox' ? m.sender : m.recipient
                const name = person ? `${person.first_name} ${person.last_name}` : '—'
                return (
                  <button
                    key={m.id}
                    onClick={() => handleRead(m)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${selected?.id === m.id ? 'bg-primary-50' : 'hover:bg-gray-50'} ${tab === 'inbox' && !m.is_read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{formatDate(m.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{m.subject}</p>
                    {tab === 'inbox' && !m.is_read && (
                      <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right pane */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden flex flex-col">
          {tab === 'compose' ? (
            <form onSubmit={handleSend} className="p-5 flex flex-col h-full space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Nouveau message</h3>
              <div>
                <label className="form-label">Destinataire (email)</label>
                <input type="email" className="form-input" placeholder="prof.diallo@masap.edu" value={form.recipient_email} onChange={e => setForm({...form, recipient_email: e.target.value})} required />
              </div>
              <div>
                <label className="form-label">Objet</label>
                <input className="form-input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="form-label">Message</label>
                <textarea className="form-input flex-1 resize-none" rows={8} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
              </div>
              <button type="submit" disabled={sending} className="btn-primary w-fit flex items-center gap-2">
                <Send className="w-4 h-4" />{sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          ) : selected ? (
            <div className="p-5 flex flex-col h-full">
              <div className="mb-4 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{selected.subject}</h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {tab === 'inbox' && selected.sender && (
                    <span>De : <span className="text-gray-600 font-medium">{selected.sender.first_name} {selected.sender.last_name}</span></span>
                  )}
                  {tab === 'sent' && selected.recipient && (
                    <span>À : <span className="text-gray-600 font-medium">{selected.recipient.first_name} {selected.recipient.last_name}</span></span>
                  )}
                  <span>{formatDate(selected.created_at)}</span>
                </div>
              </div>
              <div className="flex-1 text-sm text-gray-700 whitespace-pre-wrap overflow-y-auto">{selected.content}</div>
              {tab === 'inbox' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setForm({ recipient_email: selected.sender?.email || '', subject: `Re: ${selected.subject}`, content: '' })
                      setTab('compose')
                    }}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Send className="w-3.5 h-3.5" />Répondre
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Inbox className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sélectionnez un message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
