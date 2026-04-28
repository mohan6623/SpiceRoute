import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (userId?: string): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        userId: userId || undefined,
      },
    })
  }
  return socket
}

export const disconnectSocket = (): void => {
  socket?.disconnect()
  socket = null
}
