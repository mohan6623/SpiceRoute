import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, User, Bot, Loader2, Keyboard } from 'lucide-react'
import { getSocket } from '../lib/socketClient'
import { useAuth } from '../context/AuthContext'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

type VoiceState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'disconnected'

// Gemini-style voice icon
function GeminiVoiceIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C12 2 8 6 8 12s4 10 4 10" />
      <path d="M12 2c0 0 4 4 4 10s-4 10-4 10" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function SupportWidget() {
  const { user, session } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioQueueRef = useRef<Float32Array[]>([])
  const isPlayingRef = useRef(false)
  const voiceReadyRef = useRef(false)
  // Track the current voice turn's message ID so each turn is a separate bubble
  const currentUserMsgIdRef = useRef<string | null>(null)
  const currentModelMsgIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef(Math.random().toString(36).substring(7))
  // Track if initial welcome has been shown
  const hasShownWelcomeRef = useRef(false)

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]
  const welcomeMessage = userName
    ? `Hello ${userName.split(' ')[0]}! I'm the SpiceRoute Support AI. How can I help you today?`
    : 'Hello! I am the SpiceRoute Support AI. How can I help you today?'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Socket connection effect ──
  // Only reconnects socket when auth changes, does NOT wipe messages
  useEffect(() => {
    if (!isOpen) return
    const token = session?.access_token
    const socket = getSocket(token)
    if (!socket.connected) socket.connect()

    // Show welcome message only on first open (not on auth change)
    if (!hasShownWelcomeRef.current) {
      setMessages([{ id: 'welcome', role: 'model', text: welcomeMessage }])
      hasShownWelcomeRef.current = true
    }

    const handleConnect = () => socket.emit('session_start', { sessionId: sessionIdRef.current })
    const handleStatus = ({ state }: { state: string }) => setIsProcessing(state === 'processing')
    const handleAiText = ({ text }: { text: string }) => setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text }])
    const handleError = ({ message }: { message: string }) => setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error: ' + message }])

    // Voice-ready signal: Gemini session is open, safe to send audio
    const handleVoiceReady = () => {
      voiceReadyRef.current = true
      setVoiceState('listening')
    }
    const handleVoiceStatus = ({ state }: { state: string }) => setVoiceState(state as VoiceState)

    // ── Transcript handler: each turn = separate message bubble ──
    const handleVoiceTranscript = ({ role, text }: { role: 'user' | 'model'; text: string }) => {
      if (!text?.trim()) return

      if (role === 'user') {
        setMessages(prev => {
          const msgId = currentUserMsgIdRef.current
          if (msgId) {
            // Append to current user turn's bubble
            const idx = prev.findIndex(m => m.id === msgId)
            if (idx !== -1) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], text: updated[idx].text + text }
              return updated
            }
          }
          // Start a new user bubble for this turn
          const newId = `v-u-${Date.now()}`
          currentUserMsgIdRef.current = newId
          return [...prev, { id: newId, role: 'user', text: text.trim() }]
        })
      } else {
        setMessages(prev => {
          const msgId = currentModelMsgIdRef.current
          if (msgId) {
            // Append to current model turn's bubble
            const idx = prev.findIndex(m => m.id === msgId)
            if (idx !== -1) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], text: updated[idx].text + text }
              return updated
            }
          }
          // Start a new model bubble for this turn
          const newId = `v-m-${Date.now()}`
          currentModelMsgIdRef.current = newId
          return [...prev, { id: newId, role: 'model', text: text.trim() }]
        })
      }
    }

    const handleVoiceAudioOut = ({ data, mimeType }: { data: string; mimeType: string }) => {
      playAudioChunk(data, mimeType)
      setVoiceState('speaking')
    }

    // Barge-in: user interrupted the AI
    const handleVoiceInterrupted = () => {
      audioQueueRef.current = []
      isPlayingRef.current = false
      // Reset turn IDs so next transcript starts a new bubble
      currentUserMsgIdRef.current = null
      currentModelMsgIdRef.current = null
    }

    // Turn complete: AI finished speaking, reset for next turn
    const handleTurnComplete = () => {
      currentUserMsgIdRef.current = null
      currentModelMsgIdRef.current = null
    }

    const handleVoiceError = ({ message }: { message: string }) => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: '⚠️ ' + message }])
      setVoiceState('error')
    }

    socket.on('connect', handleConnect)
    socket.on('status', handleStatus)
    socket.on('ai_text', handleAiText)
    socket.on('error', handleError)
    socket.on('voice_ready', handleVoiceReady)
    socket.on('voice_status', handleVoiceStatus)
    socket.on('voice_transcript', handleVoiceTranscript)
    socket.on('voice_audio_out', handleVoiceAudioOut)
    socket.on('voice_interrupted', handleVoiceInterrupted)
    socket.on('voice_turn_complete', handleTurnComplete)
    socket.on('voice_error', handleVoiceError)
    if (socket.connected) handleConnect()

    return () => {
      // If voice was active, stop it because socket is about to change
      if (isVoiceMode) {
        socket.emit('voice_stop')
        stopMicCapture()
        setIsVoiceMode(false)
        setVoiceState('idle')
        voiceReadyRef.current = false
      }
      socket.off('connect', handleConnect)
      socket.off('status', handleStatus)
      socket.off('ai_text', handleAiText)
      socket.off('error', handleError)
      socket.off('voice_ready', handleVoiceReady)
      socket.off('voice_status', handleVoiceStatus)
      socket.off('voice_transcript', handleVoiceTranscript)
      socket.off('voice_audio_out', handleVoiceAudioOut)
      socket.off('voice_interrupted', handleVoiceInterrupted)
      socket.off('voice_turn_complete', handleTurnComplete)
      socket.off('voice_error', handleVoiceError)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, session?.access_token])

  // ── Audio Playback ──
  const playAudioChunk = useCallback((base64Data: string, _mimeType: string) => {
    try {
      if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 })
      }
      const ctx = playbackCtxRef.current
      const bin = atob(base64Data)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const int16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0
      audioQueueRef.current.push(float32)
      if (!isPlayingRef.current) drainQueue(ctx)
    } catch (e) { console.error('Audio playback error:', e) }
  }, [])

  const drainQueue = useCallback((ctx: AudioContext) => {
    if (audioQueueRef.current.length === 0) { isPlayingRef.current = false; return }
    isPlayingRef.current = true
    const chunk = audioQueueRef.current.shift()!
    const buf = ctx.createBuffer(1, chunk.length, 24000)
    buf.copyToChannel(chunk, 0)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.onended = () => drainQueue(ctx)
    src.start()
  }, [])

  // ── Mic Capture ──
  const startMicCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      mediaStreamRef.current = stream
      setMicPermission('granted')
      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor
      processor.onaudioprocess = (e) => {
        if (!voiceReadyRef.current) return
        const input = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(input.length)
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]))
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        const u8 = new Uint8Array(int16.buffer)
        let binary = ''
        for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
        getSocket(session?.access_token).emit('voice_audio', { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' })
      }
      source.connect(processor)
      processor.connect(ctx.destination)
    } catch {
      setMicPermission('denied')
      setIsVoiceMode(false)
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: '⚠️ Microphone permission denied. Please allow microphone access or continue with text chat.' }])
    }
  }, [session?.access_token])

  const stopMicCapture = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    mediaStreamRef.current = null
    processorRef.current?.disconnect()
    processorRef.current = null
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
    }
    audioContextRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false
    voiceReadyRef.current = false
    currentUserMsgIdRef.current = null
    currentModelMsgIdRef.current = null
  }, [])

  // ── Voice Toggle ──
  const toggleVoiceMode = useCallback(async () => {
    const socket = getSocket(session?.access_token)
    if (isVoiceMode) {
      socket.emit('voice_stop')
      stopMicCapture()
      setIsVoiceMode(false)
      setVoiceState('idle')
    } else {
      setIsVoiceMode(true)
      setVoiceState('connecting')
      voiceReadyRef.current = false
      currentUserMsgIdRef.current = null
      currentModelMsgIdRef.current = null
      await startMicCapture()
      socket.emit('voice_start')
    }
  }, [isVoiceMode, startMicCapture, stopMicCapture, session?.access_token])

  const handleClose = useCallback(() => {
    if (isVoiceMode) {
      getSocket(session?.access_token).emit('voice_stop')
      stopMicCapture()
      setIsVoiceMode(false)
      setVoiceState('idle')
    }
    getSocket(session?.access_token).emit('session_end', { sessionId: sessionIdRef.current })
    setIsOpen(false)
    // Reset so next open gets a fresh welcome
    hasShownWelcomeRef.current = false
  }, [isVoiceMode, stopMicCapture, session?.access_token])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isProcessing) return
    const text = inputText.trim()
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }])
    setInputText('')
    getSocket(session?.access_token).emit('text_message', { text, sessionId: sessionIdRef.current })
  }

  // ── Styles ──
  const avatarClass = (role: 'user' | 'model') =>
    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ' +
    (role === 'user' ? 'bg-postal/10 text-postal' : 'bg-kraft/10 text-kraft')
  const bubbleClass = (role: 'user' | 'model') =>
    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ' +
    (role === 'user' ? 'bg-postal text-white rounded-tr-none' : 'bg-white text-coffee-light border border-paper-border rounded-tl-none')

  const voiceLabel = () => {
    switch (voiceState) {
      case 'connecting': return 'Connecting...'
      case 'listening': return 'Listening...'
      case 'speaking': return 'Speaking...'
      case 'error': return 'Connection error'
      case 'disconnected': return 'Disconnected'
      default: return 'Voice active'
    }
  }
  const voiceColor = () => {
    switch (voiceState) {
      case 'listening': return 'text-green-600'
      case 'speaking': return 'text-kraft'
      case 'connecting': return 'text-blue-500'
      case 'error': return 'text-red-500'
      default: return 'text-coffee-light/60'
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end no-print">
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-paper-surface rounded-2xl shadow-kraft-lg border-2 border-kraft overflow-hidden flex flex-col mb-4 animate-fade-in">
          {/* Header */}
          <div className="bg-kraft text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold text-sm">SpiceRoute Support AI</h3>
              {isVoiceMode && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">🎙️ Live</span>}
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper">
            {messages.map((msg) => (
              <div key={msg.id} className={'flex gap-3 ' + (msg.role === 'user' ? 'flex-row-reverse' : '')}>
                <div className={avatarClass(msg.role)}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={bubbleClass(msg.role)}>{msg.text}</div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-kraft/10 text-kraft flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div>
                <div className="max-w-[75%] bg-white border border-paper-border rounded-2xl rounded-tl-none px-4 py-2.5 text-sm shadow-sm flex items-center gap-2 text-coffee-light/60">
                  <Loader2 className="w-4 h-4 animate-spin text-kraft" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-paper-border">
            {isVoiceMode ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 w-full justify-center py-1">
                  <div className="flex items-center gap-1">
                    {(voiceState === 'listening' || voiceState === 'connecting') && (
                      <>{[0, 150, 300, 150, 0].map((d, i) => <span key={i} className={`w-1.5 rounded-full animate-pulse bg-green-500`} style={{ height: `${8 + (i === 2 ? 8 : i === 1 || i === 3 ? 4 : 0)}px`, animationDelay: `${d}ms` }} />)}</>
                    )}
                    {voiceState === 'speaking' && (
                      <>{[0, 100, 200, 100, 0].map((d, i) => <span key={i} className={`w-1.5 rounded-full animate-pulse bg-kraft`} style={{ height: `${8 + (i === 2 ? 16 : i === 1 || i === 3 ? 8 : 0)}px`, animationDelay: `${d}ms` }} />)}</>
                    )}
                    {(voiceState === 'error' || voiceState === 'disconnected' || voiceState === 'idle') && (
                      <>{[...Array(5)].map((_, i) => <span key={i} className="w-1.5 h-2 bg-gray-300 rounded-full" />)}</>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${voiceColor()}`}>{voiceLabel()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={toggleVoiceMode} className="w-10 h-10 flex items-center justify-center rounded-full bg-paper border border-paper-border text-coffee-light hover:bg-paper-surface transition-colors" title="Switch to text">
                    <Keyboard className="w-5 h-5" />
                  </button>
                  <button onClick={toggleVoiceMode} className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all active:scale-95" title="End voice">
                    <X className="w-6 h-6" />
                  </button>
                  <div className="w-10 h-10" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <input
                  type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..." disabled={isProcessing}
                  className="w-full bg-paper pl-4 pr-14 py-3 rounded-full text-sm text-coffee border border-paper-border focus:outline-none focus:border-kraft focus:ring-1 focus:ring-kraft disabled:opacity-50"
                />
                <div className="absolute right-2">
                  {inputText.trim() ? (
                    <button type="submit" disabled={isProcessing} className="w-9 h-9 flex items-center justify-center bg-kraft hover:bg-kraft-light text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-gray-300">
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={toggleVoiceMode} disabled={isProcessing || micPermission === 'denied'}
                      className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white rounded-full transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
                      title={micPermission === 'denied' ? 'Mic access denied' : 'Start Gemini Live voice'}>
                      <GeminiVoiceIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <button onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        className={'w-14 h-14 rounded-full flex items-center justify-center shadow-kraft-lg text-white transition-transform hover:scale-105 active:scale-95 ' + (isOpen ? 'bg-coffee' : 'bg-kraft')}>
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
