/**
 * Performance monitoring and optimization service
 * Handles memory management, performance tracking, and optimization for PDF processing
 */

export interface PerformanceMetrics {
  memoryUsage: number;
  processingTime: number;
  fileSize: number;
  textLength: number;
  qualityScore: number;
  timestamp: Date;
}

export interface PerformanceConfig {
  maxMemoryUsage: number; // in MB
  maxProcessingTime: number; // in ms
  maxConcurrentProcessing: number;
  enableMemoryOptimization: boolean;
  enableProgressTracking: boolean;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetrics[] = [];
  private activeProcessing: Set<string> = new Set();
  private config: PerformanceConfig;

  private constructor() {
    this.config = {
      maxMemoryUsage: 100, // 100MB
      maxProcessingTime: 30000, // 30 seconds
      maxConcurrentProcessing: 3,
      enableMemoryOptimization: true,
      enableProgressTracking: true,
    };
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Track performance metrics for a processing operation
   */
  trackMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetrics);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Check for performance issues
    this.checkPerformanceIssues(fullMetrics);
  }

  /**
   * Check if we can start a new processing operation
   */
  canStartProcessing(): { allowed: boolean; reason?: string } {
    if (this.activeProcessing.size >= this.config.maxConcurrentProcessing) {
      return {
        allowed: false,
        reason: `Maximum concurrent processing limit reached (${this.config.maxConcurrentProcessing})`,
      };
    }

    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory > this.config.maxMemoryUsage) {
      return {
        allowed: false,
        reason: `Insufficient memory available (${currentMemory.toFixed(2)}MB / ${this.config.maxMemoryUsage}MB)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Start tracking a processing operation
   */
  startProcessing(operationId: string): void {
    this.activeProcessing.add(operationId);
  }

  /**
   * Stop tracking a processing operation
   */
  stopProcessing(operationId: string): void {
    this.activeProcessing.delete(operationId);
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return 0;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    averageProcessingTime: number;
    averageMemoryUsage: number;
    successRate: number;
    totalOperations: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageProcessingTime: 0,
        averageMemoryUsage: 0,
        successRate: 0,
        totalOperations: 0,
      };
    }

    const totalTime = this.metrics.reduce((sum, m) => sum + m.processingTime, 0);
    const totalMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    const successfulOps = this.metrics.filter(m => m.qualityScore > 0).length;

    return {
      averageProcessingTime: totalTime / this.metrics.length,
      averageMemoryUsage: totalMemory / this.metrics.length,
      successRate: (successfulOps / this.metrics.length) * 100,
      totalOperations: this.metrics.length,
    };
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory(): void {
    if (!this.config.enableMemoryOptimization) return;

    // Clear old metrics
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);

    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Check for performance issues and log warnings
   */
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: string[] = [];

    if (metrics.memoryUsage > this.config.maxMemoryUsage) {
      issues.push(`High memory usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    }

    if (metrics.processingTime > this.config.maxProcessingTime) {
      issues.push(`Slow processing: ${metrics.processingTime}ms`);
    }

    if (metrics.qualityScore < 0.5) {
      issues.push(`Low quality score: ${metrics.qualityScore}`);
    }

    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues.join(', '));
    }
  }

  /**
   * Get processing queue status
   */
  getQueueStatus(): {
    activeCount: number;
    maxConcurrent: number;
    memoryUsage: number;
    maxMemory: number;
  } {
    return {
      activeCount: this.activeProcessing.size,
      maxConcurrent: this.config.maxConcurrentProcessing,
      memoryUsage: this.getCurrentMemoryUsage(),
      maxMemory: this.config.maxMemoryUsage,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): {
    config: PerformanceConfig;
    currentStatus: ReturnType<PerformanceService['getQueueStatus']>;
    stats: ReturnType<PerformanceService['getPerformanceStats']>;
    recentMetrics: PerformanceMetrics[];
  } {
    return {
      config: this.config,
      currentStatus: this.getQueueStatus(),
      stats: this.getPerformanceStats(),
      recentMetrics: this.metrics.slice(-10), // Last 10 operations
    };
  }
}

export const performanceService = PerformanceService.getInstance();
