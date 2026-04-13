// ============================================================
// ThinkWeave WebSocket客户端封装 — Socket.IO
// ============================================================

import { io, Socket } from 'socket.io-client';

// TODO: 从环境变量读取 WebSocket URL
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * 初始化WebSocket连接
 *
 * TODO: 在用户登录成功后调用，传入认证token
 * TODO: 配置自动重连策略（最多5次，间隔递增）
 * TODO: 心跳检测机制（30s间隔）
 */
export function initSocket(token?: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[WS] Connection error:', error.message);
    // TODO: 显示Toast提示"实时连接失败，正在重试..."
  });

  return socket;
}

/**
 * 获取当前Socket实例
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * 断开WebSocket连接
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
