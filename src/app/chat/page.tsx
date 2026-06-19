'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SavedThought {
  messageIndex: number
  content: string
  role: 'user' | 'assistant'
}

const PHASE_LABELS = ['Stopy', 'Souvislosti', 'Slepá místa', 'Zóna hodnoty', 'Další směr']

export default function ChatPage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState(1)
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [initError, setInitError] = useState(false)

  // Editace zprávy
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')

  // Doplnění po dokončení
  const [additionInput, setAdditionInput] = useState('')

  // Uložené myšlenky
  const [savedThoughts, setSavedThoughts] = useState<SavedThought[]>([])

  // Načti uložené myšlenky
  useEffect(() => {
    const saved = localStorage.getItem('savedThoughts') ?? sessionStorage.getItem('savedThoughts')
    if (saved) {
      try { setSavedThoughts(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  // Auto-focus na textarea jakmile AI dopoví
  useEffect(() => {
    if (!loading && !complete && messages.length > 0) {
      inputRef.current?.focus()
    }
  }, [loading, complete, messages.length])

  // Načti sezení — robustně. Přežije obnovení stránky i zavření prohlížeče.
  useEffect(() => {
    const loadSession = (id: string) => {
      setSessionId(id)
      fetch(`/api/load-session?sessionId=${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.messages?.length > 0) {
            setMessages(data.messages)
            setPhase(data.currentPhase ?? 1)
            if (data.complete) setComplete(true)
          } else {
            sendMessage('', id, [])
          }
        })
        .catch(() => { sendMessage('', id, []) })
    }

    // 1) Máme uložené sezení (localStorage přežije i zavření prohlížeče)
    const storedId = localStorage.getItem('sessionId')
    if (storedId) {
      loadSession(storedId)
      return
    }

    // 2) Sezení chybí, ale máme token → obnovíme přístup a navážeme
    const token = localStorage.getItem('token')
    if (!token) {
      setInitError(true)
      return
    }
    fetch('/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid && data.sessionId) {
          localStorage.setItem('sessionId', data.sessionId)
          loadSession(data.sessionId)
        } else {
          setInitError(true)
        }
      })
      .catch(() => setInitError(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll na konec
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(
    userInput: string,
    sid: string = sessionId ?? '',
    history: Message[] = messages,
  ) {
    if (!sid) return

    const newMessages: Message[] = userInput
      ? [...history, { role: 'user', content: userInput }]
      : history

    if (userInput) {
      setMessages(newMessages)
      setInput('')
    }

    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, messages: newMessages }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Chyba serveru')

      const updated: Message[] = [
        ...newMessages,
        { role: 'assistant', content: data.message },
      ]
      setMessages(updated)
      setPhase(data.phase ?? phase)
      if (data.complete) setComplete(true)
    } catch (err) {
      console.error(err)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Omlouvám se, nastala technická chyba. Zkus odeslat zprávu znovu.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || loading || complete) return
    sendMessage(input.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // --- Editace zprávy ---
  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditContent(messages[index].content)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditContent('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const submitEdit = () => {
    if (editingIndex === null || !editContent.trim()) return
    const before = messages.slice(0, editingIndex)
    setEditingIndex(null)
    setEditContent('')
    sendMessage(editContent.trim(), sessionId ?? '', before)
  }

  // --- Doplnění po dokončení ---
  const handleAddition = () => {
    if (!additionInput.trim() || loading) return
    sendMessage(additionInput.trim())
    setAdditionInput('')
  }

  // --- Ukládání myšlenek ---
  const toggleSaveThought = (msg: Message, index: number) => {
    const alreadySaved = savedThoughts.some(t => t.messageIndex === index)
    const updated = alreadySaved
      ? savedThoughts.filter(t => t.messageIndex !== index)
      : [...savedThoughts, { messageIndex: index, content: msg.content, role: msg.role }]
    setSavedThoughts(updated)
    localStorage.setItem('savedThoughts', JSON.stringify(updated))
  }

  const isSaved = (index: number) => savedThoughts.some(t => t.messageIndex === index)

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-6">🔗</div>
          <h1 className="text-xl font-bold text-primary mb-3">Otevři prosím odkaz z e-mailu</h1>
          <p className="text-primary/70 mb-6 leading-relaxed">
            Tvůj rozhovor se nic neztratil — jen ho tahle stránka neumí načíst bez tvého odkazu.
            Klikni prosím na <strong>odkaz v e-mailu</strong> (předmět „Tvůj přístup…") a budeš pokračovat přesně tam, kde jsi přestal(a).
          </p>
          <p className="text-primary/50 text-sm">
            Kdyby cokoliv, napiš na{' '}
            <a href="mailto:lenka@inspiraise.com" className="text-secondary underline underline-offset-2">lenka@inspiraise.com</a>.
          </p>
        </div>
      </div>
    )
  }

  const progress = ((phase - 1) / 4) * 100 + 5

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header + progress */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-light px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="inspiraise" className="h-5 w-auto" />
              <span className="text-xs text-secondary/70 font-medium">· Osobní mapa hodnoty</span>
            </div>
            <p className="text-xs text-primary/50 font-medium">
              Fáze {phase} z 5 · {PHASE_LABELS[phase - 1]}
            </p>
          </div>
          <div className="w-full bg-pink-light rounded-full h-1.5">
            <div className="progress-bar h-1.5" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      </header>

      {/* Zprávy */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center text-primary/40 text-sm py-8">
              Připravuji diagnostiku…
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const isEditing = editingIndex === i
            const saved = isSaved(i)

            if (isUser) {
              return (
                <div key={i} className="flex justify-end">
                  <div className="group flex flex-col items-end gap-1">
                    {isEditing ? (
                      /* ---- editační mód ---- */
                      <div className="w-full max-w-[400px] flex flex-col gap-2">
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          rows={3}
                          className="w-full bg-peach border-2 border-secondary rounded-xl px-4 py-3 text-sm text-primary resize-none focus:outline-none"
                          style={{ maxHeight: '200px' }}
                          onInput={e => {
                            const el = e.currentTarget
                            el.style.height = 'auto'
                            el.style.height = Math.min(el.scrollHeight, 200) + 'px'
                          }}
                        />
                        <div className="flex gap-2 justify-end items-center">
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-primary/50 hover:text-primary transition-colors px-2 py-1"
                          >
                            Zrušit
                          </button>
                          <button
                            onClick={submitEdit}
                            disabled={!editContent.trim()}
                            className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40"
                          >
                            Opravit a odeslat →
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ---- normální zobrazení ---- */
                      <>
                        <div className="bubble-user max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                          {!loading && !complete && (
                            <button
                              onClick={() => startEdit(i)}
                              className="text-xs text-primary/40 hover:text-primary/70 transition-colors flex items-center gap-1"
                            >
                              ✎ opravit
                            </button>
                          )}
                          <button
                            onClick={() => toggleSaveThought(msg, i)}
                            className={`text-sm transition-colors ${saved ? 'text-orange' : 'text-primary/30 hover:text-orange'}`}
                            title={saved ? 'Odebrat z aha momentů' : 'Uložit jako aha moment'}
                          >
                            {saved ? '⭐' : '☆'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            }

            // AI zpráva
            return (
              <div key={i} className="flex justify-start group">
                <div className="w-7 h-7 rounded-full gradient-primary flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                  <img src="/submark.svg" alt="inspiraise" className="w-3.5 h-3.5 brightness-0 invert" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bubble-ai max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-primary">
                    {msg.content}
                  </div>
                  <div className="flex items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleSaveThought(msg, i)}
                      className={`text-sm transition-colors ${saved ? 'text-orange' : 'text-primary/20 hover:text-orange'}`}
                      title={saved ? 'Odebrat z aha momentů' : 'Uložit jako aha moment'}
                    >
                      {saved ? '⭐' : '☆'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Načítání */}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full gradient-primary flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div className="bubble-ai px-4 py-3">
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-pink-light rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-orange/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {/* Dokončení — karta s možností doplnit */}
          {complete && (
            <div className="py-6 space-y-4">
              {savedThoughts.length > 0 && (
                <div className="card-pink p-5">
                  <p className="font-bold text-primary text-sm mb-3">⭐ Moje aha momenty</p>
                  <ul className="space-y-2">
                    {savedThoughts.map((t, idx) => (
                      <li key={idx} className="text-sm text-primary/75 flex items-start gap-2">
                        <span className="text-orange flex-shrink-0 mt-0.5">💡</span>
                        <span className="line-clamp-3 leading-snug">{t.content}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card p-6 space-y-4">
                <div>
                  <p className="font-bold text-primary text-lg">Máme hotovo! 🌟</p>
                  <p className="text-primary/65 text-sm leading-relaxed mt-1">
                    Je něco důležitého, co bys chtěl/a dodat, než se pustím do skládání tvé Osobní mapy hodnoty?
                  </p>
                </div>

                <div className="flex gap-2 items-end">
                  <textarea
                    value={additionInput}
                    onChange={e => setAdditionInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddition() }
                    }}
                    onInput={e => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                    }}
                    disabled={loading}
                    placeholder="Napiš, co tě ještě napadá…"
                    rows={2}
                    className="flex-1 bg-peach border border-pink-light rounded-xl px-4 py-3 text-sm text-primary placeholder:text-primary/40 resize-none focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleAddition}
                    disabled={!additionInput.trim() || loading}
                    className="btn-secondary px-4 py-3 text-sm flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Odeslat
                  </button>
                </div>

                <button
                  onClick={() => router.push('/report')}
                  className="btn-primary w-full text-center"
                >
                  Sestavit moji mapu →
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      {!complete && (
        <footer className="bg-white/80 backdrop-blur-sm border-t border-pink-light px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || editingIndex !== null}
              placeholder="Napiš svou odpověď… klidně víc vět, čím konkrétněji, tím přesnější výsledek. (Enter = odeslat, Shift+Enter = nový řádek)"
              rows={4}
              className="flex-1 bg-peach border border-pink-light rounded-xl px-4 py-3.5 text-base text-primary placeholder:text-primary/40 resize-none focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 leading-relaxed"
              style={{ minHeight: '112px', maxHeight: '320px' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(Math.max(el.scrollHeight, 112), 320) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || editingIndex !== null}
              className="btn-primary px-5 py-3 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              Odeslat
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
