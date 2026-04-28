import { Server, Socket } from 'socket.io'
import { getAIResponse, ConversationTurn } from '../services/aiService'

const conversationHistory = new Map<string, ConversationTurn[]>()

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const getUserId = () => socket.handshake.auth.userId as string | undefined

  socket.on('session_start', ({ sessionId }: { sessionId: string }) => {
    conversationHistory.set(sessionId, [])
    socket.emit('status', { state: 'idle' })
    console.log(`Session started: ${sessionId} for User: ${getUserId() || 'Anonymous'}`)
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
      console.log(`Received message in session ${sessionId}: "${text}"`)

      const history = conversationHistory.get(sessionId) || []
      const userId = getUserId()
      
      const { responseText, updatedHistory } = await getAIResponse(
        text,
        history,
        userId
      )
      
      conversationHistory.set(sessionId, updatedHistory)
      
      // Emit the AI's response text
      socket.emit('ai_text', { text: responseText })
      socket.emit('status', { state: 'idle' })
      
    } catch (err: unknown) {
      console.error('Socket error:', err)
      const message = err instanceof Error ? err.message : 'Something went wrong'
      socket.emit('error', { message })
      socket.emit('status', { state: 'idle' })
    }
  })

  socket.on('session_end', ({ sessionId }: { sessionId: string }) => {
    conversationHistory.delete(sessionId)
    console.log(`Session ended: ${sessionId}`)
  })
}
