import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function initSocketIO(io: Server) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // When a user opens a seat selection screen, join the room for that show
    socket.on('join:show', (showId: string) => {
      socket.join(`show_${showId}`);
    });

    socket.on('leave:show', (showId: string) => {
      socket.leave(`show_${showId}`);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });
}

export function broadcastSeatsUpdated(showId: string, payload: { seatIds: string[]; status: string; lockedBy?: string }) {
  if (ioInstance) {
    ioInstance.to(`show_${showId}`).emit('seats:updated', payload);
  }
}
