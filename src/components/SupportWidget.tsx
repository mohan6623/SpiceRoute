import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react'
import { getSocket } from '../lib/socketClient'
import { useAuth } from '../context/AuthContext'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

export default function SupportWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: 'Hello! I am the SpiceRoute Support AI. How can I help you today?' }
  ])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Unique session ID for this window instance
  const sessionIdRef = useRef(Math.random().toString(36).substring(7))

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return

    // Initialize socket and connect
    const socket = getSocket(user?.id)
    
    if (!socket.connected) {
      socket.connect()
    }

    // Set up listeners
    const handleConnect = () => {
      socket.emit('session_start', { sessionId: sessionIdRef.current })
    }

    const handleStatus = ({ state }: { state: string }) => {
      setIsProcessing(state === 'processing')
    }

    const handleAiText = ({ text }: { text: string }) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text }])
    }

    const handleError = ({ message }: { message: string }) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error: ' + message }])
    }

    socket.on('connect', handleConnect)
    socket.on('status', handleStatus)
    socket.on('ai_text', handleAiText)
    socket.on('error', handleError)

    // If already connected, emit session_start immediately
    if (socket.connected) {
      handleConnect()
    }

    // Clean up if the component unmounts or closes
    return () => {
      socket.off('connect', handleConnect)
      socket.off('status', handleStatus)
      socket.off('ai_text', handleAiText)
      socket.off('error', handleError)
    }
  }, [isOpen, user?.id])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isProcessing) return

    const text = inputText.trim()
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }])
    setInputText('')

    // Send to backend
    const socket = getSocket()
    socket.emit('text_message', { text, sessionId: sessionIdRef.current })
  }

  const avatarClass = (role: 'user' | 'model') =>
    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' +
    (role === 'user' ? 'bg-postal/10 text-postal' : 'bg-kraft/10 text-kraft')

  const bubbleClass = (role: 'user' | 'model') =>
    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ' +
    (role === 'user'
      ? 'bg-postal text-white rounded-tr-none'
      : 'bg-white text-coffee-light border border-paper-border rounded-tl-none')

  const fabClass =
    'w-14 h-14 rounded-full flex items-center justify-center shadow-kraft-lg text-white transition-transform hover:scale-105 active:scale-95 ' +
    (isOpen ? 'bg-coffee' : 'bg-kraft')

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end no-print">
      {/* Widget Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-paper-surface rounded-2xl shadow-kraft-lg border-2 border-kraft overflow-hidden flex flex-col mb-4 animate-fade-in">
          {/* Header */}
          <div className="bg-kraft text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold text-sm">SpiceRoute Support AI</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={'flex gap-3 ' + (msg.role === 'user' ? 'flex-row-reverse' : '')}
              >
                <div className={avatarClass(msg.role)}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={bubbleClass(msg.role)}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-kraft/10 text-kraft flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-[75%] bg-white border border-paper-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm shadow-sm flex items-center gap-2 text-coffee-light/60">
                  <Loader2 className="w-4 h-4 animate-spin text-kraft" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-paper-border">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="w-full bg-paper pl-4 pr-12 py-3 rounded-full text-sm text-coffee border border-paper-border focus:outline-none focus:border-kraft focus:ring-1 focus:ring-kraft disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isProcessing}
                className="absolute right-2 w-8 h-8 flex items-center justify-center bg-kraft hover:bg-kraft-light text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-gray-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-coffee-light/50">
                🎙️ Voice support coming soon
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={fabClass}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
