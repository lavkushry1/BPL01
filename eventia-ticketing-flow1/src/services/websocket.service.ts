import config from '@/config';
import { io, Socket } from 'socket.io-client';

interface EventHandler {
  (data: any): void;
}

/**
 * Service for handling WebSocket connections for real-time updates
 */
class WebSocketService {
  // ... (keep existing properties)
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5
  private reconnectInterval = 3000; // 3 seconds
  private heartbeatInterval: any = null;
  private lastHeartbeat: number = Date.now();
  private eventCallbacks: Record<string, Array<(data: any) => void>> = {};
  private pingTimeout: number = 30000; // 30 seconds
  private pingTimer: any = null;

  /**
   * Initialize WebSocket connection
   */
  public init(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Use the WEBSOCKET_URL from config
    const wsUrl = config.api.wsUrl;

    this.socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000, // 10 seconds connection timeout
      transports: ['websocket', 'polling'] // Add polling as fallback
    });

    this.attachListeners();
    this.startHeartbeat();
  }

  /**
   * Start heartbeat to detect disconnections
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send a ping every 25 seconds and expect a pong response
    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected) {
        console.log('Heartbeat detected disconnection, attempting reconnect...');
        this.reconnect();
        return;
      }

      if (this.socket) {
        this.lastHeartbeat = Date.now();

        // Set a timeout to check for pong response
        if (this.pingTimer) {
          clearTimeout(this.pingTimer);
        }

        this.socket.emit('ping');

        this.pingTimer = setTimeout(() => {
          // If no pong received in pingTimeout ms, consider connection lost
          const elapsed = Date.now() - this.lastHeartbeat;
          if (elapsed >= this.pingTimeout) {
            console.log('Ping timeout, connection may be lost. Attempting reconnect...');
            this.isConnected = false;
            this.reconnect();
          }
        }, this.pingTimeout);
      }
    }, 25000); // 25 seconds
  }

  /**
   * Attach listeners for connection events
   */
  private attachListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // When reconnected, rejoin rooms and re-authenticate if needed
      this.restoreState();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      this.isConnected = false;

      // Always try to reconnect regardless of reason
      if (reason !== 'io client disconnect') {
        // Don't reconnect if the client intentionally disconnected
        setTimeout(() => this.reconnect(), this.reconnectInterval);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('Maximum reconnection attempts reached');
        // Instead of disconnecting, keep trying with exponential backoff
        setTimeout(() => this.reconnect(), Math.min(30000, this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts)));
      } else {
        setTimeout(() => this.reconnect(), this.reconnectInterval);
      }
    });

    // Handle pong response to update heartbeat
    this.socket.on('pong', () => {
      this.lastHeartbeat = Date.now();
    });

    // Setup handlers for specific events
    this.setupEventHandlers();
  }

  /**
   * Restore previous state after reconnection
   */
  private restoreState(): void {
    // Re-join event rooms and re-authenticate
    const userId = localStorage.getItem('user_id');
    const lastEventId = localStorage.getItem('last_event_id');

    if (userId) {
      this.authenticateUser(userId);
    }

    if (lastEventId) {
      this.joinEvent(lastEventId);
    }
  }

  /**
   * Setup handlers for specific event types
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Seat status changes - match exact event names from backend
    this.socket.on('seat_status_change', (data) => {
      this.triggerEventHandlers('seat_status_change', data);
    });

    // Payment status changes
    this.socket.on('payment_status_change', (data) => {
      this.triggerEventHandlers('payment_status_change', data);
    });

    // Booking status changes
    this.socket.on('booking_status_change', (data) => {
      this.triggerEventHandlers('booking_status_change', data);
    });

    // Ticket generation
    this.socket.on('ticket_generation', (data) => {
      this.triggerEventHandlers('ticket_generation', data);
    });

    // User-specific ticket generation
    this.socket.on('tickets_generated', (data) => {
      this.triggerEventHandlers('tickets_generated', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.triggerEventHandlers('socket_error', error);
    });
  }

  /**
   * Join event room to receive event-specific updates
   * @param eventId Event ID
   */
  public joinEvent(eventId: string): void {
    if (this.socket) {
      this.socket.emit('join_event', eventId); // Match backend event name
      localStorage.setItem('last_event_id', eventId);

      if (!this.isConnected) {
        console.warn('Socket not connected, event will be joined upon reconnection');
      }
    } else {
      console.warn('Socket not initialized, cannot join event room');
      this.init(); // Auto-initialize if needed
    }
  }

  /**
   * Authenticate as a user to receive user-specific updates
   * @param userId User ID
   */
  public authenticateUser(userId: string): void {
    if (this.socket) {
      this.socket.emit('authenticate', userId); // Match backend event name
      localStorage.setItem('user_id', userId);

      if (!this.isConnected) {
        console.warn('Socket not connected, user will be authenticated upon reconnection');
      }
    } else {
      console.warn('Socket not initialized, cannot authenticate user');
      this.init(); // Auto-initialize if needed
    }
  }

  /**
   * Register an event handler
   * @param event Event name
   * @param handler Handler function
   */
  public on(event: string, handler: EventHandler): void {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }

    this.eventCallbacks[event].push(handler);
  }

  /**
   * Remove an event handler
   * @param event Event name
   * @param handler Handler function to remove
   */
  public off(event: string, handler?: EventHandler): void {
    if (!handler) {
      delete this.eventCallbacks[event];
    } else if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== handler);
    }
  }

  /**
   * Trigger all registered handlers for an event
   * @param event Event name
   * @param data Event data
   */
  private triggerEventHandlers(event: string, data: any): void {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Manually reconnect to the WebSocket server
   */
  public reconnect(): void {
    if (this.socket) {
      console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.socket.connect();
    } else {
      this.init();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
    this.eventCallbacks = {};
    console.log('WebSocket disconnected');
  }

  /**
   * Check if the WebSocket is connected
   * @returns True if connected
   */
  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the socket instance
   * @returns Socket instance or null
   */
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Export as singleton
export const websocketService = new WebSocketService();
export default websocketService;
