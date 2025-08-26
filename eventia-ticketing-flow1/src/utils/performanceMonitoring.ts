/**
 * Mobile Performance Monitoring Utility
 * 
 * This utility provides functions to monitor and report key mobile performance metrics
 * including input delay, memory usage, and other Core Web Vitals.
 */

import { debounce } from 'lodash';

// Types for performance metrics
interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number;  // First Contentful Paint
  lcp?: number;  // Largest Contentful Paint
  cls?: number;  // Cumulative Layout Shift
  fid?: number;  // First Input Delay
  inp?: number;  // Interaction to Next Paint
  ttfb?: number; // Time to First Byte
  
  // Mobile-specific metrics
  memoryUsage?: number;  // Memory usage in MB
  batteryLevel?: number; // Battery level percentage
  networkType?: string;  // Network connection type
  effectiveConnectionType?: string; // Effective connection type (4g, 3g, etc)
  devicePixelRatio?: number; // Device pixel ratio for screen density
  viewport?: { width: number; height: number }; // Viewport dimensions
  orientation?: string; // Device orientation
  
  // Custom metrics
  timeToInteractive?: number; // Time until page is fully interactive
  jsHeapSize?: number; // JavaScript heap size
  domNodes?: number; // Number of DOM nodes
  touchResponseTime?: number[]; // Array of touch response times
}

// Configuration options
interface MonitoringConfig {
  apiEndpoint: string;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  reportingInterval: number; // ms between batched reports
  enabledMetrics: string[];
}

// Default configuration
const defaultConfig: MonitoringConfig = {
  apiEndpoint: '/api/v1/metrics/mobile',
  sampleRate: 0.1, // Monitor 10% of sessions
  reportingInterval: 60000, // Report every minute
  enabledMetrics: ['fcp', 'lcp', 'cls', 'fid', 'inp', 'memoryUsage', 'networkType', 'touchResponseTime']
};

class MobilePerformanceMonitor {
  private config: MonitoringConfig;
  private metrics: PerformanceMetrics = {};
  private touchEvents: number[] = [];
  private isMonitoring = false;
  private sessionId: string;
  private debouncedSendReport: () => void;
  
  constructor(customConfig: Partial<MonitoringConfig> = {}) {
    this.config = { ...defaultConfig, ...customConfig };
    this.sessionId = this.generateSessionId();
    this.debouncedSendReport = debounce(this.sendReport.bind(this), this.config.reportingInterval);
  }
  
  /**
   * Start monitoring performance metrics
   */
  public start(): void {
    // Only monitor based on sample rate
    if (Math.random() > this.config.sampleRate) {
      console.debug('Performance monitoring skipped based on sample rate');
      return;
    }
    
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    // Set up observers for Core Web Vitals
    this.observeCoreWebVitals();
    
    // Monitor mobile-specific metrics
    this.monitorMobileMetrics();
    
    // Monitor touch response time
    this.monitorTouchResponsiveness();
    
    // Schedule periodic reporting
    setInterval(() => {
      this.collectMetrics();
      this.debouncedSendReport();
    }, this.config.reportingInterval);
    
    // Collect initial metrics
    this.collectMetrics();
    
    console.debug('Mobile performance monitoring started');
  }
  
  /**
   * Stop monitoring performance metrics
   */
  public stop(): void {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;
    
    // Remove event listeners
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchend', this.handleTouchEnd);
    
    // Send final report
    this.sendReport();
    
    console.debug('Mobile performance monitoring stopped');
  }
  
  /**
   * Observe Core Web Vitals metrics using Performance Observer API
   */
  private observeCoreWebVitals(): void {
    // Observe paint metrics (FCP)
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const fcp = entries[0];
            this.metrics.fcp = fcp.startTime;
            console.debug(`FCP: ${this.metrics.fcp}ms`);
            this.debouncedSendReport();
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
        
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          // We use the latest LCP event
          const lcp = entries[entries.length - 1];
          this.metrics.lcp = lcp.startTime;
          console.debug(`LCP: ${this.metrics.lcp}ms`);
          this.debouncedSendReport();
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const firstInput = entries[0];
            this.metrics.fid = firstInput.processingStart - firstInput.startTime;
            console.debug(`FID: ${this.metrics.fid}ms`);
            this.debouncedSendReport();
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        
        // Layout Shifts
        let cumulativeLayoutShift = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // Only count layout shifts without recent user input
            if (!(entry as any).hadRecentInput) {
              cumulativeLayoutShift += (entry as any).value;
            }
          }
          this.metrics.cls = cumulativeLayoutShift;
          console.debug(`CLS: ${this.metrics.cls}`);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        
      } catch (e) {
        console.error('Error setting up performance observers:', e);
      }
    }
  }
  
  /**
   * Monitor mobile-specific metrics like memory, battery, and network
   */
  private monitorMobileMetrics(): void {
    // Memory usage (if available)
    if ((performance as any).memory) {
      this.metrics.jsHeapSize = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage = (performance as any).memory.totalJSHeapSize / (1024 * 1024);
    }
    
    // Network information (if available)
    if ((navigator as any).connection) {
      const connection = (navigator as any).connection;
      this.metrics.networkType = connection.type;
      this.metrics.effectiveConnectionType = connection.effectiveType;
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.metrics.networkType = connection.type;
        this.metrics.effectiveConnectionType = connection.effectiveType;
        console.debug(`Network changed: ${this.metrics.effectiveConnectionType}`);
        this.debouncedSendReport();
      });
    }
    
    // Battery information (if available)
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        this.metrics.batteryLevel = battery.level * 100;
        
        // Listen for battery changes
        battery.addEventListener('levelchange', () => {
          this.metrics.batteryLevel = battery.level * 100;
        });
      });
    }
    
    // Device and viewport information
    this.metrics.devicePixelRatio = window.devicePixelRatio;
    this.metrics.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    this.metrics.orientation = screen.orientation ? screen.orientation.type : 'unknown';
    
    // Listen for orientation changes
    window.addEventListener('resize', () => {
      this.metrics.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      this.metrics.orientation = screen.orientation ? screen.orientation.type : 'unknown';
    });
    
    // Count DOM nodes (can impact performance)
    this.metrics.domNodes = document.querySelectorAll('*').length;
  }
  
  /**
   * Monitor touch responsiveness by measuring time between touchstart and touchend
   */
  private monitorTouchResponsiveness(): void {
    let touchStartTime = 0;
    
    this.handleTouchStart = () => {
      touchStartTime = performance.now();
    };
    
    this.handleTouchEnd = () => {
      if (touchStartTime > 0) {
        const responseTime = performance.now() - touchStartTime;
        this.touchEvents.push(responseTime);
        
        // Keep only the last 10 touch events
        if (this.touchEvents.length > 10) {
          this.touchEvents.shift();
        }
        
        // Update metrics with average touch response time
        this.metrics.touchResponseTime = [...this.touchEvents];
        
        // If response time is high, report immediately
        if (responseTime > 100) {
          console.debug(`High touch response time: ${responseTime}ms`);
          this.debouncedSendReport();
        }
        
        touchStartTime = 0;
      }
    };
    
    window.addEventListener('touchstart', this.handleTouchStart);
    window.addEventListener('touchend', this.handleTouchEnd);
  }
  
  /**
   * Collect current metrics snapshot
   */
  private collectMetrics(): void {
    // Update memory usage if available
    if ((performance as any).memory) {
      this.metrics.jsHeapSize = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage = (performance as any).memory.totalJSHeapSize / (1024 * 1024);
    }
    
    // Update DOM node count
    this.metrics.domNodes = document.querySelectorAll('*').length;
    
    // Time to Interactive approximation (if Navigation Timing API is available)
    if (performance.timing) {
      const navTiming = performance.timing;
      this.metrics.ttfb = navTiming.responseStart - navTiming.navigationStart;
      this.metrics.timeToInteractive = navTiming.domInteractive - navTiming.navigationStart;
    }
  }
  
  /**
   * Send metrics report to backend API
   */
  private sendReport(): void {
    if (!this.isMonitoring) return;
    
    const filteredMetrics: Partial<PerformanceMetrics> = {};
    
    // Only include enabled metrics
    for (const metric of this.config.enabledMetrics) {
      if (metric in this.metrics) {
        filteredMetrics[metric as keyof PerformanceMetrics] = 
          this.metrics[metric as keyof PerformanceMetrics];
      }
    }
    
    const payload = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: filteredMetrics
    };
    
    // Send to backend
    fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      // Use keepalive to ensure the request completes even if page is unloading
      keepalive: true
    }).catch(error => {
      console.error('Error sending performance metrics:', error);
    });
    
    console.debug('Performance metrics sent:', payload);
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Event handlers
  private handleTouchStart: EventListener;
  private handleTouchEnd: EventListener;
}

// Create singleton instance
const performanceMonitor = new MobilePerformanceMonitor();

export default performanceMonitor;