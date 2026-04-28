/**
 * liveAIService.test.ts
 *
 * TDD tests for the voice session lifecycle in liveAIService.ts.
 * These tests reproduce the bugs that cause voice to silently fail when a
 * user is logged in, and verify the fixes.
 *
 * Bugs covered:
 *  1. getUserInfo() crash causes silent disconnect in voice_start handler
 *  2. Gemini connect() rejection → no voice_error emitted → frontend stuck
 *  3. sendAudioToLiveSession: returns false before session is ready
 *  4. closeLiveSession idempotency (safe to call twice / on missing session)
 */

// ─── Mock @google/genai BEFORE any imports that use it ───────────────────────
// jest.mock is hoisted to the top of the file by Babel/ts-jest,
// so we cannot reference module-level variables inside the factory.
// Instead we use a lazy accessor pattern via `jest.fn()` with a shared store.

// Shared mock state accessible inside and outside jest.mock factory
const mockStore = {
  close: jest.fn(),
  sendRealtimeInput: jest.fn(),
  sendToolResponse: jest.fn(),
  callbacks: {} as {
    onopen?: () => void
    onmessage?: (msg: unknown) => void
    onerror?: (e: ErrorEvent) => void
    onclose?: (e: CloseEvent) => void
  },
  connectMock: jest.fn(),
}

jest.mock('@google/genai', () => {
  const session = {
    close: (...args: unknown[]) => mockStore.close(...args),
    sendRealtimeInput: (...args: unknown[]) => mockStore.sendRealtimeInput(...args),
    sendToolResponse: (...args: unknown[]) => mockStore.sendToolResponse(...args),
  }

  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      live: {
        connect: (...args: unknown[]) => mockStore.connectMock(...args),
      },
    })),
    Modality: { AUDIO: 'AUDIO' },
    Type: { OBJECT: 'OBJECT', STRING: 'STRING' },
    __session: session, // expose for use in connectMock
  }
})

jest.mock('../services/bookingService', () => ({
  getBookingByTrackingId: jest.fn().mockResolvedValue(null),
  getBookingsByPhone: jest.fn().mockResolvedValue([]),
  getBookingsByUserId: jest.fn().mockResolvedValue([]),
}))

jest.mock('dotenv', () => ({ config: jest.fn() }))

// ─── Now import the module under test ────────────────────────────────────────
import { Socket } from 'socket.io'
import {
  startLiveSession,
  sendAudioToLiveSession,
  closeLiveSession,
  hasLiveSession,
} from '../services/liveAIService'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockSocket(id = 'socket-test-1') {
  const emitted: Array<{ event: string; data: unknown }> = []
  const sock = {
    id,
    emit: jest.fn((event: string, data?: unknown) => {
      emitted.push({ event, data })
    }),
    _emitted: emitted,
  }
  // Cast to Socket — the service only uses .id and .emit, so this is safe for testing
  return sock as unknown as Socket & { _emitted: typeof emitted }
}

/** Configure connectMock to resolve with a session and capture callbacks */
function setupConnectSuccess() {
  mockStore.connectMock.mockImplementation(({ callbacks }: { callbacks: typeof mockStore.callbacks }) => {
    mockStore.callbacks = callbacks || {}
    const genai = jest.requireMock('@google/genai')
    return Promise.resolve(genai.__session)
  })
}

/** Configure connectMock to reject */
function setupConnectFailure(error: Error) {
  mockStore.connectMock.mockRejectedValueOnce(error)
}

// ─── Global beforeEach ────────────────────────────────────────────────────────
beforeEach(async () => {
  // Clean up any active sessions between tests
  // We'll call close on anything that was opened
  mockStore.close.mockClear()
  mockStore.sendRealtimeInput.mockClear()
  mockStore.sendToolResponse.mockClear()
  mockStore.connectMock.mockClear()
  mockStore.callbacks = {}

  setupConnectSuccess() // default: connect resolves
})

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY 1 — sendAudioToLiveSession
// ═════════════════════════════════════════════════════════════════════════════
describe('sendAudioToLiveSession', () => {
  it('returns false when no session exists for the socket', () => {
    const result = sendAudioToLiveSession('non-existent-socket', 'base64audio==')
    expect(result).toBe(false)
  })

  it('returns false when session exists but is not yet ready (onopen not fired)', async () => {
    const socket = makeMockSocket('socket-not-ready')
    // Start session but do NOT fire onopen → sessionReady stays false
    startLiveSession(socket, undefined)
    // Don't await — just let it be in flight

    const result = sendAudioToLiveSession('socket-not-ready', 'base64audio==')
    expect(result).toBe(false)

    // Cleanup: fire onclose
    mockStore.callbacks.onopen?.()
    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })

  it('returns true and forwards audio when session is ready', async () => {
    const socket = makeMockSocket('socket-ready-audio')
    await startLiveSession(socket, undefined)
    // Mark session ready
    mockStore.callbacks.onopen?.()

    const result = sendAudioToLiveSession('socket-ready-audio', 'base64audio==', 'audio/pcm;rate=16000')
    expect(result).toBe(true)
    expect(mockStore.sendRealtimeInput).toHaveBeenCalledWith({
      audio: { data: 'base64audio==', mimeType: 'audio/pcm;rate=16000' },
    })

    // Cleanup
    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY 2 — closeLiveSession
// ═════════════════════════════════════════════════════════════════════════════
describe('closeLiveSession', () => {
  it('is safe to call when no session exists (no-op)', async () => {
    await expect(closeLiveSession('no-session-at-all')).resolves.toBeUndefined()
  })

  it('closes the Gemini session and removes it from active map', async () => {
    const socket = makeMockSocket('socket-to-close')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    expect(hasLiveSession('socket-to-close')).toBe(true)
    await closeLiveSession('socket-to-close')
    expect(mockStore.close).toHaveBeenCalledTimes(1)
    expect(hasLiveSession('socket-to-close')).toBe(false)
  })

  it('is idempotent — second call is a no-op and does not throw', async () => {
    const socket = makeMockSocket('socket-double-close')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    await closeLiveSession('socket-double-close')
    // Second call: session is already gone
    await expect(closeLiveSession('socket-double-close')).resolves.toBeUndefined()
    // session.close() called only ONCE
    expect(mockStore.close).toHaveBeenCalledTimes(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY 3 — startLiveSession: logged-in user path
// This is the PRIMARY bug path. When logged in, voice silently fails.
// ═════════════════════════════════════════════════════════════════════════════
describe('startLiveSession — logged-in user path', () => {
  /**
   * THE BUG REPRODUCTION TEST:
   * When a logged-in user starts voice, startLiveSession receives userInfo.
   * The Gemini session MUST open and emit 'voice_ready' to unlock audio.
   * Before the fix, any issue in the auth path would cause a silent disconnect.
   */
  it('emits voice_ready after Gemini session opens for a logged-in user', async () => {
    const socket = makeMockSocket('socket-logged-in')
    const userInfo = { id: 'user-uuid-123', name: 'Mohan' }

    await startLiveSession(socket, userInfo)
    mockStore.callbacks.onopen?.()

    const events = socket._emitted.map((e) => e.event)
    // CRITICAL: voice_ready MUST be emitted to unlock audio streaming on frontend
    expect(events).toContain('voice_ready')
    expect(events).toContain('voice_status')

    const voiceStatus = socket._emitted.find((e) => e.event === 'voice_status')
    expect(voiceStatus?.data).toEqual({ state: 'listening' })

    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })

  it('includes user name in system instruction for logged-in user', async () => {
    const socket = makeMockSocket('socket-named-user')
    const userInfo = { id: 'user-abc', name: 'Priya' }

    await startLiveSession(socket, userInfo)
    mockStore.callbacks.onopen?.()

    expect(mockStore.connectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          systemInstruction: expect.stringContaining('Priya'),
        }),
      })
    )

    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })

  it('marks user as NOT logged in when userInfo is undefined (anonymous path)', async () => {
    const socket = makeMockSocket('socket-anon')

    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    const callArg = mockStore.connectMock.mock.calls[0][0]
    expect(callArg.config.systemInstruction).toContain('NOT logged in')

    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })

  /**
   * BUG: If Gemini connect() rejects (API error, quota exceeded, network issue),
   * the frontend was left stuck in 'connecting' state with no feedback.
   * The fix ensures voice_error is always emitted on rejection.
   */
  it('emits voice_error if Gemini Live connection rejects', async () => {
    setupConnectFailure(new Error('Gemini API quota exceeded'))

    const socket = makeMockSocket('socket-connect-fail')
    await startLiveSession(socket, { id: 'user-123', name: 'Test' })

    const events = socket._emitted.map((e) => e.event)
    expect(events).toContain('voice_error')

    const errorEvent = socket._emitted.find((e) => e.event === 'voice_error')
    expect(errorEvent?.data).toMatchObject({ message: expect.any(String) })
  })

  it('emits voice_error and error voice_status when Gemini fires onerror', async () => {
    const socket = makeMockSocket('socket-gemini-error')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    mockStore.callbacks.onerror?.({ message: 'WebSocket error' } as ErrorEvent)

    const errorEvent = socket._emitted.find((e) => e.event === 'voice_error')
    expect(errorEvent).toBeDefined()

    const statusError = socket._emitted.find(
      (e) => e.event === 'voice_status' && (e.data as { state: string }).state === 'error'
    )
    expect(statusError).toBeDefined()

    mockStore.callbacks.onclose?.({ code: 1006 } as CloseEvent)
  })

  it('emits voice_status:disconnected when session closes', async () => {
    const socket = makeMockSocket('socket-close-event')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    mockStore.callbacks.onclose?.({ code: 1001 } as CloseEvent)

    const disconnectEvent = socket._emitted.find(
      (e) => e.event === 'voice_status' && (e.data as { state: string }).state === 'disconnected'
    )
    expect(disconnectEvent).toBeDefined()
    expect(hasLiveSession('socket-close-event')).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// CATEGORY 4 — hasLiveSession
// ═════════════════════════════════════════════════════════════════════════════
describe('hasLiveSession', () => {
  it('returns false for an unknown socket', () => {
    expect(hasLiveSession('completely-unknown')).toBe(false)
  })

  it('returns true after session is started and opened', async () => {
    const socket = makeMockSocket('socket-has-check')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    expect(hasLiveSession('socket-has-check')).toBe(true)
    mockStore.callbacks.onclose?.({ code: 1000 } as CloseEvent)
  })

  it('returns false after the session is closed', async () => {
    const socket = makeMockSocket('socket-post-close')
    await startLiveSession(socket, undefined)
    mockStore.callbacks.onopen?.()

    await closeLiveSession('socket-post-close')
    expect(hasLiveSession('socket-post-close')).toBe(false)
  })
})
