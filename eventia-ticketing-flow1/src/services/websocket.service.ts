import { io, Socket } from 'socket.io-client';

interface EventHandler {
  (data: any): void;
}

/**
 * Service for handling WebSocket connections for real-time updates
 */
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private eventCallbacks: Record<string, Array<(data: any) => void>> = {};

  /**
   * Initialize WebSocket connection
   */
  public init(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Use the WEBSOCKET_URL from environment variables directly
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:4000';
    
    this.socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: this.reconnectInterval,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'] // Add polling as fallback
    });

    this.attachListeners();
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
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        console.error('Maximum reconnection attempts reached');
        this.socket?.disconnect();
      }
    });

    // Setup handlers for specific events
    this.setupEventHandlers();
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
  }

  /**
   * Join event room to receive event-specific updates
   * @param eventId Event ID
   */
  public joinEvent(eventId: string): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('join_event', eventId); // Match backend event name
    } else {
      console.warn('Socket not connected, cannot join event room');
    }
  }

  /**
   * Authenticate as a user to receive user-specific updates
   * @param userId User ID
   */
  public authenticateUser(userId: string): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('authenticate', userId); // Match backend event name
    } else {
      console.warn('Socket not connected, cannot authenticate user');
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
      this.socket.connect();
    } else {
      this.init();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
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