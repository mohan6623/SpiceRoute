import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, User, Bot, Loader2, Mic, MicOff, Keyboard } from 'lucide-react'
import { getSocket, disconnectSocket } from '../lib/socketClient'
import { useAuth } from '../context/AuthContext'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
}

type VoiceState = 'idle' | 'listening' | 'speaking' | 'error' | 'disconnected'

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
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioQueueRef = useRef<Float32Array[]>([])
  const isPlayingRef = useRef(false)
  const currentTranscriptRef = useRef<{ user: string; model: string }>({ user: '', model: '' })

  // Unique session ID for this window instance
  const sessionIdRef = useRef(Math.random().toString(36).substring(7))

  // Generate the personalized welcome message
  const welcomeMessage = user?.user_metadata?.full_name
    ? `Hello ${user.user_metadata.full_name.split(' ')[0]}! I'm the SpiceRoute Support AI. How can I help you today?`
    : 'Hello! I am the SpiceRoute Support AI. How can I help you today?'

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return

    // Initialize socket with JWT token
    const token = session?.access_token
    const socket = getSocket(token)

    if (!socket.connected) {
      socket.connect()
    }

    // Reset messages with welcome on open
    setMessages([{ id: 'welcome', role: 'model', text: welcomeMessage }])

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

    // ── Voice event listeners ──────────────────────────────────
    const handleVoiceStatus = ({ state }: { state: string }) => {
      setVoiceState(state as VoiceState)
    }

    const handleVoiceTranscript = ({ role, text }: { role: 'user' | 'model'; text: string }) => {
      if (!text?.trim()) return

      if (role === 'user') {
        // Accumulate user transcript
        currentTranscriptRef.current.user += text
        const fullText = currentTranscriptRef.current.user.trim()
        if (fullText) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg?.role === 'user' && lastMsg.id.startsWith('voice-user-')) {
              // Update existing user message
              return [...prev.slice(0, -1), { ...lastMsg, text: fullText }]
            }
            // New user message
            return [...prev, { id: `voice-user-${Date.now()}`, role: 'user', text: fullText }]
          })
        }
      } else {
        // Accumulate model transcript
        currentTranscriptRef.current.model += text
        const fullText = currentTranscriptRef.current.model.trim()
        if (fullText) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg?.role === 'model' && lastMsg.id.startsWith('voice-model-')) {
              // Update existing model message — live text as AI speaks
              return [...prev.slice(0, -1), { ...lastMsg, text: fullText }]
            }
            // New model message
            return [...prev, { id: `voice-model-${Date.now()}`, role: 'model', text: fullText }]
          })
        }
      }
    }

    const handleVoiceAudioOut = ({ data, mimeType }: { data: string; mimeType: string }) => {
      playAudioChunk(data, mimeType)
      setVoiceState('speaking')
    }

    const handleVoiceError = ({ message }: { message: string }) => {
      console.error('Voice error:', message)
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: '⚠️ ' + message }])
      setVoiceState('error')
    }

    socket.on('connect', handleConnect)
    socket.on('status', handleStatus)
    socket.on('ai_text', handleAiText)
    socket.on('error', handleError)
    socket.on('voice_status', handleVoiceStatus)
    socket.on('voice_transcript', handleVoiceTranscript)
    socket.on('voice_audio_out', handleVoiceAudioOut)
    socket.on('voice_error', handleVoiceError)

    if (socket.connected) {
      handleConnect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('status', handleStatus)
      socket.off('ai_text', handleAiText)
      socket.off('error', handleError)
      socket.off('voice_status', handleVoiceStatus)
      socket.off('voice_transcript', handleVoiceTranscript)
      socket.off('voice_audio_out', handleVoiceAudioOut)
      socket.off('voice_error', handleVoiceError)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, session?.access_token])

  // ═══════════════════════════════════════════════════════════════
  //  AUDIO PLAYBACK — receives PCM from Gemini Live API
  // ═══════════════════════════════════════════════════════════════

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
    }
    return audioContextRef.current
  }, [])

  const playAudioChunk = useCallback((base64Data: string, _mimeType: string) => {
    try {
      const ctx = getAudioContext()
      const binaryStr = atob(base64Data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      // Convert raw 16-bit PCM to Float32 for Web Audio
      const int16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0
      }

      audioQueueRef.current.push(float32)

      if (!isPlayingRef.current) {
        playNextChunk(ctx)
      }
    } catch (e) {
      console.error('Audio playback error:', e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAudioContext])

  const playNextChunk = useCallback((ctx: AudioContext) => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const chunk = audioQueueRef.current.shift()!
    const buffer = ctx.createBuffer(1, chunk.length, 24000)
    buffer.copyToChannel(chunk, 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.onended = () => playNextChunk(ctx)
    source.start()
  }, [])

  // ═══════════════════════════════════════════════════════════════
  //  MIC CAPTURE — sends PCM to backend
  // ═══════════════════════════════════════════════════════════════

  const startMicCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      mediaStreamRef.current = stream
      setMicPermission('granted')

      const ctx = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)

      // Use ScriptProcessor for broader compatibility
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        // Convert Float32 to Int16 PCM
        const int16 = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }

        // Convert to base64
        const uint8 = new Uint8Array(int16.buffer)
        let binary = ''
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i])
        }
        const base64 = btoa(binary)

        // Send to backend
        const socket = getSocket()
        socket.emit('voice_audio', { data: base64, mimeType: 'audio/pcm;rate=16000' })
      }

      source.connect(processor)
      processor.connect(ctx.destination)

      console.log('🎙️ Mic capture started')
    } catch (err) {
      console.error('Mic permission denied:', err)
      setMicPermission('denied')
      setIsVoiceMode(false)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '⚠️ Microphone permission denied. Please allow microphone access to use voice mode, or continue with text chat.'
      }])
    }
  }, [])

  const stopMicCapture = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    // Clear audio playback queue
    audioQueueRef.current = []
    isPlayingRef.current = false
    console.log('🔇 Mic capture stopped')
  }, [])

  // ═══════════════════════════════════════════════════════════════
  //  VOICE MODE TOGGLE
  // ═══════════════════════════════════════════════════════════════

  const toggleVoiceMode = useCallback(async () => {
    const socket = getSocket()

    if (isVoiceMode) {
      // Stop voice mode
      socket.emit('voice_stop')
      stopMicCapture()
      setIsVoiceMode(false)
      setVoiceState('idle')
      currentTranscriptRef.current = { user: '', model: '' }
    } else {
      // Start voice mode
      setIsVoiceMode(true)
      setVoiceState('idle')
      currentTranscriptRef.current = { user: '', model: '' }

      // Request mic permission and start capturing
      await startMicCapture()

      // Tell backend to open Gemini Live session
      socket.emit('voice_start')
      setVoiceState('listening')
    }
  }, [isVoiceMode, startMicCapture, stopMicCapture])

  // Clean up voice on widget close
  const handleClose = useCallback(() => {
    if (isVoiceMode) {
      const socket = getSocket()
      socket.emit('voice_stop')
      stopMicCapture()
      setIsVoiceMode(false)
      setVoiceState('idle')
    }
    const socket = getSocket()
    socket.emit('session_end', { sessionId: sessionIdRef.current })
    setIsOpen(false)
  }, [isVoiceMode, stopMicCapture])

  // ═══════════════════════════════════════════════════════════════
  //  TEXT SEND (existing)
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  //  STYLES
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  //  VOICE STATUS LABEL
  // ═══════════════════════════════════════════════════════════════

  const getVoiceStatusLabel = () => {
    switch (voiceState) {
      case 'listening': return 'Listening...'
      case 'speaking': return 'AI is speaking...'
      case 'error': return 'Connection error'
      case 'disconnected': return 'Disconnected'
      default: return 'Voice mode active'
    }
  }

  const getVoiceStatusColor = () => {
    switch (voiceState) {
      case 'listening': return 'text-green-600'
      case 'speaking': return 'text-kraft'
      case 'error': return 'text-red-500'
      case 'disconnected': return 'text-gray-400'
      default: return 'text-coffee-light/60'
    }
  }

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
              {isVoiceMode && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  🎙️ Voice
                </span>
              )}
            </div>
            <button
              onClick={handleClose}
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
            {isVoiceMode ? (
              /* ── Voice Mode UI ─────────────────────────────── */
              <div className="flex flex-col items-center gap-2">
                {/* Waveform / Status indicator */}
                <div className="flex items-center gap-3 w-full justify-center py-2">
                  {/* Animated dots for voice activity */}
                  <div className="flex items-center gap-1">
                    {voiceState === 'listening' && (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-4 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                        <span className="w-2 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      </>
                    )}
                    {voiceState === 'speaking' && (
                      <>
                        <span className="w-2 h-2 bg-kraft rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-4 bg-kraft rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                        <span className="w-2 h-6 bg-kraft rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                        <span className="w-2 h-4 bg-kraft rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                        <span className="w-2 h-2 bg-kraft rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      </>
                    )}
                    {(voiceState === 'idle' || voiceState === 'error' || voiceState === 'disconnected') && (
                      <>
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                        <span className="w-2 h-2 bg-gray-300 rounded-full" />
                      </>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getVoiceStatusColor()}`}>
                    {getVoiceStatusLabel()}
                  </span>
                </div>

                {/* Voice control buttons */}
                <div className="flex items-center gap-3">
                  {/* Switch to text mode */}
                  <button
                    onClick={toggleVoiceMode}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-paper border border-paper-border text-coffee-light hover:bg-paper-surface transition-colors"
                    title="Switch to text mode"
                  >
                    <Keyboard className="w-5 h-5" />
                  </button>

                  {/* Stop voice */}
                  <button
                    onClick={toggleVoiceMode}
                    className="w-14 h-14 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors animate-pulse"
                    title="Stop voice"
                  >
                    <MicOff className="w-6 h-6" />
                  </button>

                  {/* Spacer for symmetry */}
                  <div className="w-10 h-10" />
                </div>
              </div>
            ) : (
              /* ── Text Mode UI ──────────────────────────────── */
              <div>
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isProcessing}
                    className="w-full bg-paper pl-4 pr-20 py-3 rounded-full text-sm text-coffee border border-paper-border focus:outline-none focus:border-kraft focus:ring-1 focus:ring-kraft disabled:opacity-50"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {/* Mic button */}
                    <button
                      type="button"
                      onClick={toggleVoiceMode}
                      disabled={isProcessing || micPermission === 'denied'}
                      className="w-8 h-8 flex items-center justify-center text-kraft hover:bg-kraft/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={micPermission === 'denied' ? 'Microphone access denied' : 'Start voice mode'}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isProcessing}
                      className="w-8 h-8 flex items-center justify-center bg-kraft hover:bg-kraft-light text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-gray-300"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        className={fabClass}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
