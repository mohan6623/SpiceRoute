import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let currentToken: string | undefined = undefined

export const getSocket = (token?: string): Socket => {
  // If the token has changed, disconnect and recreate the socket
  if (socket && token !== currentToken) {
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    currentToken = token
    socket = io(import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        token: token || undefined,
      },
    })
  }
  return socket
}

export const disconnectSocket = (): void => {
  socket?.disconnect()
  socket = null
  currentToken = undefined
}
