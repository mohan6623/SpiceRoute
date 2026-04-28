# PRD Addendum v2 — Voice AI Customer Support Feature
# SpiceRoute — Add this to the existing PRD

---

## A1. FEATURE OVERVIEW

Add an AI-powered 2-way audio customer service agent to SpiceRoute.
Users can press a button, speak their query, and the AI speaks back
the answer in real time — all over WebSockets.

This feature has two parts:
1. A Node.js WebSocket server deployed on Render.com
2. GCP AI APIs (STT + Gemini + TTS) called from that server

---

## A2. NEW SERVICES & ACCOUNTS NEEDED

Before starting development, make sure these are ready:

- [ ] Render.com account (free, connect via GitHub)
- [ ] GCP project with billing enabled ($300 trial credit)
- [ ] Enable these 3 APIs in GCP Console:
      → Cloud Speech-to-Text API
      → Cloud Text-to-Speech API
      → Vertex AI API
- [ ] Create a GCP Service Account with these roles:
      → Cloud Speech Client
      → Cloud Text-to-Speech Client
      → Vertex AI User
- [ ] Download the Service Account JSON key file
- [ ] Keep the JSON key ready for environment variables

---

## A3. NEW REPOSITORIES

Create a separate GitHub repo for the backend:

Repo name: spiceroute-backend

This is separate from the React frontend repo.
Render.com will connect to this repo for deployment.

---

## A4. BACKEND PROJECT STRUCTURE

```
spiceroute-backend/
├── src/
│   ├── index.ts
│   ├── socket/
│   │   └── audioHandler.ts
│   ├── services/
│   │   ├── sttService.ts
│   │   ├── aiService.ts
│   │   ├── ttsService.ts
│   │   └── bookingService.ts
│   └── lib/
│       └── supabase.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── render.yaml
```

---

## A5. BACKEND DEPENDENCIES

```bash
npm init -y
npm install express socket.io @google-cloud/speech @google-cloud/text-to-speech
npm install @google-cloud/vertexai @supabase/supabase-js cors dotenv
npm install -D typescript @types/node @types/express ts-node nodemon
```

---

## A6. BACKEND ENVIRONMENT VARIABLES

### `.env` (never commit this)
```
PORT=3001
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GCP_PROJECT_ID=your_gcp_project_id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=paste_entire_service_account_json_here
FRONTEND_URL=https://spiceroute.me
```

### `.env.example`
```
PORT=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GCP_PROJECT_ID=
GCP_LOCATION=
GOOGLE_APPLICATION_CREDENTIALS_JSON=
FRONTEND_URL=
```

Note: Store the entire GCP service account JSON as a single
environment variable string. Parse it in code like this:

```typescript
const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!
)
```

This avoids needing to upload the JSON file to Render.

---

## A7. BACKEND ENTRY POINT

### `src/index.ts`

```typescript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerAudioHandlers } from './socket/audioHandler'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e7, // 10MB for audio chunks
})

app.use(cors({ origin: process.env.FRONTEND_URL }))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  registerAudioHandlers(io, socket)
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`SpiceRoute backend running on port ${PORT}`)
})
```

---

## A8. WEBSOCKET EVENT CONTRACT

### Client → Server

| Event | Payload | When |
|---|---|---|
| `session_start` | `{ sessionId: string }` | User opens support widget |
| `audio_chunk` | `{ chunk: ArrayBuffer }` | While user is speaking |
| `audio_end` | `{ sessionId: string }` | User stops speaking |
| `text_message` | `{ text: string, sessionId: string }` | Text fallback input |
| `session_end` | `{ sessionId: string }` | User closes widget |

### Server → Client

| Event | Payload | When |
|---|---|---|
| `status` | `{ state: string }` | Pipeline state changes |
| `transcript` | `{ text: string }` | STT result ready |
| `ai_text` | `{ text: string }` | Gemini response ready |
| `audio_chunk` | `{ chunk: Buffer }` | TTS audio streaming |
| `audio_end` | `{}` | TTS stream complete |
| `error` | `{ message: string }` | Any pipeline failure |

Status states: `'listening'` → `'processing'` → `'speaking'` → `'idle'`

---

## A9. SOCKET AUDIO HANDLER

### `src/socket/audioHandler.ts`

```typescript
import { Server, Socket } from 'socket.io'
import { transcribeAudio } from '../services/sttService'
import { getAIResponse } from '../services/aiService'
import { synthesizeSpeech } from '../services/ttsService'

const audioBuffers = new Map<string, Buffer[]>()
const conversationHistory = new Map<string, Array<{
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}>>()

export const registerAudioHandlers = (io: Server, socket: Socket) => {
  socket.on('session_start', ({ sessionId }: { sessionId: string }) => {
    audioBuffers.set(sessionId, [])
    conversationHistory.set(sessionId, [])
    socket.emit('status', { state: 'idle' })
  })

  socket.on('audio_chunk', ({ chunk }: { chunk: ArrayBuffer }) => {
    // Chunks arrive as ArrayBuffer from browser — convert to Buffer
    const buffer = Buffer.from(chunk)
    const sessionId = socket.id
    const existing = audioBuffers.get(sessionId) || []
    audioBuffers.set(sessionId, [...existing, buffer])
  })

  socket.on('audio_end', async ({ sessionId }: { sessionId: string }) => {
    try {
      socket.emit('status', { state: 'processing' })

      // Step 1: Transcribe audio
      const chunks = audioBuffers.get(sessionId) || []
      const audioBuffer = Buffer.concat(chunks)
      audioBuffers.set(sessionId, []) // clear after use

      const transcript = await transcribeAudio(audioBuffer)
      socket.emit('transcript', { text: transcript })

      // Step 2: Get AI response
      const history = conversationHistory.get(sessionId) || []
      const { responseText, updatedHistory } = await getAIResponse(
        transcript,
        history
      )
      conversationHistory.set(sessionId, updatedHistory)
      socket.emit('ai_text', { text: responseText })

      // Step 3: Synthesize speech
      socket.emit('status', { state: 'speaking' })
      const audioContent = await synthesizeSpeech(responseText)
      socket.emit('audio_chunk', { chunk: audioContent })
      socket.emit('audio_end', {})
      socket.emit('status', { state: 'idle' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      socket.emit('error', { message })
      socket.emit('status', { state: 'idle' })
    }
  })

  socket.on('text_message', async ({
    text,
    sessionId
  }: {
    text: string
    sessionId: string
  }) => {
    try {
      socket.emit('status', { state: 'processing' })
      socket.emit('transcript', { text })

      const history = conversationHistory.get(sessionId) || []
      const { responseText, updatedHistory } = await getAIResponse(
        text,
        history
      )
      conversationHistory.set(sessionId, updatedHistory)
      socket.emit('ai_text', { text: responseText })

      socket.emit('status', { state: 'speaking' })
      const audioContent = await synthesizeSpeech(responseText)
      socket.emit('audio_chunk', { chunk: audioContent })
      socket.emit('audio_end', {})
      socket.emit('status', { state: 'idle' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      socket.emit('error', { message })
      socket.emit('status', { state: 'idle' })
    }
  })

  socket.on('session_end', ({ sessionId }: { sessionId: string }) => {
    audioBuffers.delete(sessionId)
    conversationHistory.delete(sessionId)
  })
}
```

---

## A10. GCP SPEECH-TO-TEXT SERVICE

### `src/services/sttService.ts`

```typescript
import speech from '@google-cloud/speech'

const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!
)

const client = new speech.SpeechClient({ credentials })

export const transcribeAudio = async (
  audioBuffer: Buffer
): Promise<string> => {
  const [response] = await client.recognize({
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'WEBM_OPUS',     // Browser MediaRecorder default
      sampleRateHertz: 48000,
      languageCode: 'en-IN',     // Indian English
      alternativeLanguageCodes: ['ta-IN', 'ml-IN'], // Tamil + Malayalam fallback
      model: 'latest_short',
    },
  })

  const transcript = response.results
    ?.map((r) => r.alternatives?.[0]?.transcript || '')
    .join(' ')
    .trim()

  if (!transcript) throw new Error('Could not understand the audio. Please try again.')
  return transcript
}
```

---

## A11. VERTEX AI GEMINI SERVICE

### `src/services/aiService.ts`

```typescript
import { VertexAI } from '@google-cloud/vertexai'
import { getBookingByTrackingId, getBookingsByPhone } from './bookingService'

const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!
)

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID!,
  location: process.env.GCP_LOCATION!,
  googleAuthOptions: { credentials },
})

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

const SYSTEM_PROMPT = `
You are SpiceRoute's friendly AI customer support agent for India Post parcel bookings.
SpiceRoute is a web app for booking parcels via India Post across India.

Your job:
- Help users track their parcels
- Answer questions about their bookings
- Explain SpiceRoute services (Speed Post, Registered Post, Express Parcel Post)
- Keep all responses under 2 sentences — they will be spoken aloud
- Be friendly, clear, and professional
- If asked to cancel or modify a booking, ask them to email support@spiceroute.me

Services offered:
- Speed Post: 2-3 business days
- Registered Post: 5-7 business days
- Express Parcel Post: 1-2 business days

If the user gives a tracking ID (format: IP2026XXXXXX) or phone number,
that booking data will be included in the message for you to use.
Never make up booking details — only use data provided to you.
Do not answer questions unrelated to SpiceRoute or parcel delivery.
`

type ConversationTurn = {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export const getAIResponse = async (
  userMessage: string,
  history: ConversationTurn[]
): Promise<{
  responseText: string
  updatedHistory: ConversationTurn[]
}> => {
  // Extract tracking ID or phone from message
  const trackingIdMatch = userMessage.match(/IP2026\d{6}/i)
  const phoneMatch = userMessage.match(/\b[6-9]\d{9}\b/)

  let bookingContext = ''

  if (trackingIdMatch) {
    const booking = await getBookingByTrackingId(
      trackingIdMatch[0].toUpperCase()
    )
    if (booking) {
      bookingContext = `\n\nBooking data: ${JSON.stringify(booking)}`
    } else {
      bookingContext = `\n\nNo booking found for tracking ID ${trackingIdMatch[0]}.`
    }
  } else if (phoneMatch) {
    const bookings = await getBookingsByPhone(phoneMatch[0])
    if (bookings.length > 0) {
      bookingContext = `\n\nBookings for this phone: ${JSON.stringify(bookings)}`
    } else {
      bookingContext = `\n\nNo bookings found for phone number ${phoneMatch[0]}.`
    }
  }

  const messageWithContext = userMessage + bookingContext

  const chat = model.startChat({
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
    history,
  })

  const result = await chat.sendMessage(messageWithContext)
  const responseText =
    result.response.candidates?.[0]?.content?.parts?.[0]?.text ||
    'Sorry, I could not process your request. Please try again.'

  const updatedHistory: ConversationTurn[] = [
    ...history,
    { role: 'user', parts: [{ text: messageWithContext }] },
    { role: 'model', parts: [{ text: responseText }] },
  ]

  return { responseText, updatedHistory }
}
```

---

## A12. GCP TEXT-TO-SPEECH SERVICE

### `src/services/ttsService.ts`

```typescript
import textToSpeech from '@google-cloud/text-to-speech'

const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!
)

const client = new textToSpeech.TextToSpeechClient({ credentials })

export const synthesizeSpeech = async (
  text: string
): Promise<Buffer> => {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-IN',
      name: 'en-IN-Neural2-A',   // Natural Indian English voice
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0,
    },
  })

  if (!response.audioContent) {
    throw new Error('TTS returned empty audio')
  }

  return Buffer.from(response.audioContent as Uint8Array)
}
```

---

## A13. SUPABASE BOOKING SERVICE (BACKEND)

### `src/services/bookingService.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Use service role key on backend — bypasses RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const getBookingByTrackingId = async (trackingId: string) => {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('tracking_id', trackingId)
    .single()
  return data
}

export const getBookingsByPhone = async (phone: string) => {
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('sender_phone', phone)
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}
```

---

## A14. RENDER.COM DEPLOYMENT CONFIG

### `render.yaml`
```yaml
services:
  - type: web
    name: spiceroute-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: node dist/index.js
    envVars:
      - key: PORT
        value: 3001
      - key: NODE_ENV
        value: production
```

### `package.json` scripts
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node src/index.ts"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Render.com Deploy Steps
1. Push spiceroute-backend to GitHub
2. Go to render.com → New → Web Service
3. Connect the GitHub repo
4. Build command: `npm install && npm run build`
5. Start command: `node dist/index.js`
6. Add all env variables from A6 manually in the dashboard
7. Copy the live Render URL (e.g. https://spiceroute-backend.onrender.com)
8. Paste that URL into React frontend .env as VITE_WEBSOCKET_URL

---

## A15. FRONTEND ADDITIONS

### Add to React frontend `.env`
```
VITE_WEBSOCKET_URL=https://spiceroute-backend.onrender.com
```

### New frontend dependency
```bash
npm install socket.io-client
```

### New file: `src/lib/socketClient.ts`
```typescript
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
      transports: ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

export const disconnectSocket = (): void => {
  socket?.disconnect()
  socket = null
}
```

### New component: `src/components/SupportWidget.tsx`

A floating button fixed to the bottom-right of every page.

States:
- **Idle** — mic button + "Talk to Support AI" label
- **Listening** — animated pulse rings, "Listening..." label, stop button
- **Processing** — spinner, "SpiceRoute AI is thinking..."
- **Speaking** — waveform animation, AI voice plays from browser

Widget panel (opens on button click):
- Header: "SpiceRoute Support AI"
- Conversation area (scrollable):
  - User messages → right-aligned, blue bubbles
  - AI messages → left-aligned, white bubbles
  - Show transcript text alongside audio
- Hold-to-speak mic button (primary)
- Text input field + send button (fallback)
- Close (X) button

Audio recording implementation:
```typescript
// Use MediaRecorder API with audio/webm;codecs=opus
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
})
mediaRecorder.ondataavailable = (e) => {
  socket.emit('audio_chunk', { chunk: e.data })
}
```

Audio playback implementation:
```typescript
// Collect audio_chunk buffers, play on audio_end
const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' })
const audioUrl = URL.createObjectURL(audioBlob)
const audio = new Audio(audioUrl)
audio.play()
```

### Mount SupportWidget in `App.tsx`
Place this outside `<Routes>` so it appears on all pages:
```tsx
<Router>
  <Navbar />
  <Routes>
    ...existing routes...
  </Routes>
  <SupportWidget />   {/* ADD THIS */}
</Router>
```

---

## A16. SAMPLE CONVERSATIONS TO TEST

| User Says | Expected Response |
|---|---|
| "Track my parcel IP2026482910" | "Your parcel IP2026482910 is currently In Transit and should arrive in 2 business days." |
| "Where is my package?" | "Please share your tracking ID — it starts with IP2026 — or the phone number you used when booking." |
| "What services do you offer?" | "SpiceRoute offers Speed Post in 2 to 3 days, Registered Post in 5 to 7 days, and Express Parcel Post in 1 to 2 days." |
| "I want to cancel my booking" | "Please email support@spiceroute.me with your tracking ID and we will process your cancellation." |
| "How much did I pay?" | "Could you share your tracking ID or registered phone number so I can pull up your booking?" |

---

## A17. UPDATED FINAL CHECKLIST (add to existing Section 15)

- [ ] Render.com backend deploys successfully from GitHub repo
- [ ] `/health` endpoint returns `{ status: 'ok' }`
- [ ] WebSocket connection established from React frontend
- [ ] Browser mic audio streams correctly to backend
- [ ] GCP STT returns accurate transcript for spoken English
- [ ] Gemini returns booking-aware responses when tracking ID is spoken
- [ ] GCP TTS audio plays back clearly in browser
- [ ] SupportWidget renders on all 4 pages (bottom-right)
- [ ] Text fallback input works when mic permission is denied
- [ ] Conversation history persists within one session
- [ ] Session clears on widget close
- [ ] All GCP credentials stored as env variables, not hardcoded
- [ ] VITE_WEBSOCKET_URL points to live Render URL in production
