/**
 * WebSocket Notification Handler
 * Real-time notification delivery to web browsers
 */

// Store active WebSocket connections
const connections = new Map<string, Set<WebSocket>>();

/**
 * Register WebSocket connection for user
 */
export function registerConnection(userId: string, ws: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }

  connections.get(userId)!.add(ws);

  console.log(
    `📡 WebSocket connected for user ${userId} (${connections.get(userId)!.size} active connections)`,
  );

  // Handle disconnection
  ws.addEventListener("close", () => {
    unregisterConnection(userId, ws);
  });
}

/**
 * Unregister WebSocket connection
 */
export function unregisterConnection(userId: string, ws: WebSocket) {
  const userConnections = connections.get(userId);

  if (userConnections) {
    userConnections.delete(ws);

    if (userConnections.size === 0) {
      connections.delete(userId);
      console.log(
        `📡 WebSocket disconnected for user ${userId} (no more active connections)`,
      );
    } else {
      console.log(
        `📡 WebSocket disconnected for user ${userId} (${userConnections.size} remaining)`,
      );
    }
  }
}

/**
 * Send notification to user via WebSocket
 */
export function sendNotificationToUser(
  userId: string,
  notification: {
    id?: string;
    title: string;
    body: string;
    imageUrl?: string;
    data?: Record<string, any>;
    actions?: Array<{ id: string; title: string }>;
    priority?: string;
    sentAt?: string;
  },
) {
  const userConnections = connections.get(userId);

  if (!userConnections || userConnections.size === 0) {
    console.log(`⚠️ No active WebSocket connections for user ${userId}`);
    return { success: false, reason: "no_active_connections" };
  }

  const message = JSON.stringify({
    type: "notification",
    payload: notification,
  });

  let successCount = 0;
  let failureCount = 0;

  userConnections.forEach((ws) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        successCount++;
      } else {
        failureCount++;
        // Clean up dead connections
        userConnections.delete(ws);
      }
    } catch (error) {
      console.error(
        `❌ Error sending WebSocket message to user ${userId}:`,
        error,
      );
      failureCount++;
      userConnections.delete(ws);
    }
  });

  console.log(
    `📡 WebSocket notification sent to user ${userId}: ${successCount} success, ${failureCount} failed`,
  );

  return {
    success: successCount > 0,
    successCount,
    failureCount,
  };
}

/**
 * Broadcast notification to all connected users
 */
export function broadcastNotification(notification: {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, any>;
  priority?: string;
}) {
  const message = JSON.stringify({
    type: "broadcast",
    payload: notification,
  });

  let totalSuccess = 0;
  let totalFailure = 0;

  connections.forEach((userConnections, userId) => {
    userConnections.forEach((ws) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          totalSuccess++;
        } else {
          totalFailure++;
          userConnections.delete(ws);
        }
      } catch (error) {
        console.error(`❌ Error broadcasting to user ${userId}:`, error);
        totalFailure++;
        userConnections.delete(ws);
      }
    });
  });

  console.log(
    `📡 Broadcast sent: ${totalSuccess} success, ${totalFailure} failed`,
  );

  return {
    success: totalSuccess > 0,
    successCount: totalSuccess,
    failureCount: totalFailure,
  };
}

/**
 * Get active connection count
 */
export function getActiveConnectionCount(): {
  totalUsers: number;
  totalConnections: number;
} {
  let totalConnections = 0;

  connections.forEach((userConnections) => {
    totalConnections += userConnections.size;
  });

  return {
    totalUsers: connections.size,
    totalConnections,
  };
}

/**
 * Check if user is online (has active WebSocket connection)
 */
export function isUserOnline(userId: string): boolean {
  const userConnections = connections.get(userId);
  return userConnections ? userConnections.size > 0 : false;
}

/**
 * Create WebSocket endpoint handler for Oak
 */
export function createWebSocketHandler() {
  return async (ctx: any) => {
    // Get userId from query params or auth token
    const userId = ctx.request.url.searchParams.get("userId");

    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = { error: "userId parameter required" };
      return;
    }

    // Upgrade to WebSocket
    if (!ctx.isUpgradable) {
      ctx.response.status = 400;
      ctx.response.body = { error: "WebSocket upgrade required" };
      return;
    }

    const ws = await ctx.upgrade();

    // Register connection
    registerConnection(userId, ws);

    // Send connection confirmation
    ws.send(
      JSON.stringify({
        type: "connected",
        payload: {
          userId,
          timestamp: new Date().toISOString(),
        },
      }),
    );

    // Handle incoming messages (e.g., acknowledgments, read receipts)
    ws.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "ping") {
          ws.send(
            JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (message.type === "notification_read") {
          // Handle notification read receipt
          console.log(
            `📖 User ${userId} read notification: ${message.notificationId}`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error handling WebSocket message from user ${userId}:`,
          error,
        );
      }
    });

    // Handle errors
    ws.addEventListener("error", (error) => {
      console.error(`❌ WebSocket error for user ${userId}:`, error);
    });
  };
}
