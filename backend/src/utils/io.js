// io.js - Singleton io instance manager
let io = null;

const setIO = (ioInstance) => {
  io = ioInstance;
};

const getIO = () => {
  if (!io) {
    console.error("[IO] Socket.IO instance not initialized");
    return null;
  }
  return io;
};

module.exports = { setIO, getIO };
