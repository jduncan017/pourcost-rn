/**
 * Feedback Service for PourCost-RN
 * Centralizes user feedback, error handling, and notification management
 * Provides consistent feedback patterns across the application
 */

import { Alert, AlertButton } from 'react-native';
import { HapticService } from './haptic-service';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';
export type FeedbackDuration = 'short' | 'long' | 'permanent';

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  duration: FeedbackDuration;
  action?: {
    label: string;
    onPress: () => void;
  };
  timestamp: Date;
}

export interface ErrorContext {
  screen: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

// In-memory feedback queue (in production, might use a more sophisticated solution)
let feedbackQueue: FeedbackMessage[] = [];
let feedbackListeners: Array<(messages: FeedbackMessage[]) => void> = [];

/**
 * Feedback service class
 */
export class FeedbackService {
  
  // ==========================================
  // ERROR HANDLING
  // ==========================================

  /**
   * Handle and display application errors
   * @param error - Error object or message
   * @param context - Context information
   * @param showToUser - Whether to show error to user
   */
  static handleError(
    error: Error | string,
    context?: ErrorContext,
    showToUser: boolean = true
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorDetails = error instanceof Error ? error.stack : undefined;

    // Log error for debugging
    console.error('Application Error:', {
      message: errorMessage,
      details: errorDetails,
      context,
      timestamp: new Date().toISOString(),
    });

    // Show user-friendly error if requested
    if (showToUser) {
      const userMessage = this.getUserFriendlyErrorMessage(errorMessage);
      this.showError(userMessage.title, userMessage.message);
    }

    // In production, you might want to send to crash reporting service
    // this.reportError(error, context);
  }

  /**
   * Convert technical error messages to user-friendly ones
   * @param errorMessage - Technical error message
   * @returns User-friendly error
   */
  private static getUserFriendlyErrorMessage(errorMessage: string): {
    title: string;
    message: string;
  } {
    // Network errors
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
      };
    }

    // Validation errors
    if (errorMessage.includes('Validation failed') || errorMessage.includes('Invalid')) {
      return {
        title: 'Invalid Input',
        message: errorMessage.replace('Validation failed: ', ''),
      };
    }

    // Not found errors
    if (errorMessage.includes('not found')) {
      return {
        title: 'Item Not Found',
        message: 'The requested item could not be found.',
      };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
      };
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  /**
   * Show error alert dialog
   * @param title - Error title
   * @param message - Error message
   * @param actions - Custom actions
   */
  static showError(
    title: string,
    message: string,
    actions?: AlertButton[]
  ): void {
    // Trigger error haptic feedback
    HapticService.error();
    
    const defaultActions: AlertButton[] = [
      { text: 'OK', style: 'cancel' }
    ];

    Alert.alert(title, message, actions || defaultActions);
  }

  // ==========================================
  // SUCCESS FEEDBACK
  // ==========================================

  /**
   * Show success message
   * @param title - Success title
   * @param message - Success message
   * @param action - Optional action button
   */
  static showSuccess(
    title: string,
    message: string,
    action?: { label: string; onPress: () => void }
  ): void {
    // Trigger success haptic feedback
    HapticService.success();
    
    this.addFeedbackMessage({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration: 'short',
      action,
      timestamp: new Date(),
    });
  }

  /**
   * Show success alert dialog
   * @param title - Success title
   * @param message - Success message
   * @param onClose - Callback when closed
   */
  static showSuccessAlert(
    title: string,
    message: string,
    onClose?: () => void
  ): void {
    Alert.alert(title, message, [
      { text: 'Great!', style: 'default', onPress: onClose }
    ]);
  }

  // ==========================================
  // WARNING & INFO FEEDBACK
  // ==========================================

  /**
   * Show warning message
   * @param title - Warning title
   * @param message - Warning message
   * @param action - Optional action
   */
  static showWarning(
    title: string,
    message: string,
    action?: { label: string; onPress: () => void }
  ): void {
    this.addFeedbackMessage({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration: 'long',
      action,
      timestamp: new Date(),
    });
  }

  /**
   * Show info message
   * @param title - Info title
   * @param message - Info message
   * @param duration - Display duration
   */
  static showInfo(
    title: string,
    message: string,
    duration: FeedbackDuration = 'short'
  ): void {
    this.addFeedbackMessage({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration,
      timestamp: new Date(),
    });
  }

  // ==========================================
  // CONFIRMATION DIALOGS
  // ==========================================

  /**
   * Show confirmation dialog
   * @param options - Confirmation options
   */
  static showConfirmation(options: ConfirmationOptions): void {
    const {
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      destructive = false,
      onConfirm,
      onCancel,
    } = options;

    const buttons: AlertButton[] = [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await onConfirm();
          } catch (error) {
            this.handleError(error instanceof Error ? error : String(error));
          }
        },
      },
    ];

    Alert.alert(title, message, buttons);
  }

  /**
   * Show delete confirmation dialog
   * @param itemName - Name of item to delete
   * @param onConfirm - Confirmation callback
   * @param itemType - Type of item (ingredient, cocktail, etc.)
   */
  static showDeleteConfirmation(
    itemName: string,
    onConfirm: () => void | Promise<void>,
    itemType: string = 'item'
  ): void {
    this.showConfirmation({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm,
    });
  }

  /**
   * Show bulk delete confirmation
   * @param count - Number of items
   * @param itemType - Type of items
   * @param onConfirm - Confirmation callback
   */
  static showBulkDeleteConfirmation(
    count: number,
    itemType: string,
    onConfirm: () => void | Promise<void>
  ): void {
    this.showConfirmation({
      title: `Delete ${count} ${itemType}s`,
      message: `Are you sure you want to delete ${count} ${itemType}s? This action cannot be undone.`,
      confirmText: 'Delete All',
      destructive: true,
      onConfirm,
    });
  }

  // ==========================================
  // LOADING & PROGRESS FEEDBACK
  // ==========================================

  /**
   * Show loading feedback with custom message
   * @param message - Loading message
   * @param cancellable - Whether loading can be cancelled
   * @param onCancel - Cancel callback
   */
  static showLoading(
    message: string = 'Loading...',
    cancellable: boolean = false,
    onCancel?: () => void
  ): string {
    const loadingId = this.generateId();
    
    this.addFeedbackMessage({
      id: loadingId,
      type: 'info',
      title: message,
      message: '',
      duration: 'permanent',
      action: cancellable && onCancel ? { label: 'Cancel', onPress: onCancel } : undefined,
      timestamp: new Date(),
    });

    return loadingId;
  }

  /**
   * Hide loading feedback
   * @param loadingId - ID returned from showLoading
   */
  static hideLoading(loadingId: string): void {
    this.removeFeedbackMessage(loadingId);
  }

  // ==========================================
  // OPERATION FEEDBACK
  // ==========================================

  /**
   * Show feedback for successful operations
   * @param operation - Operation name
   * @param itemName - Item name
   * @param additionalMessage - Additional context
   */
  static showOperationSuccess(
    operation: string,
    itemName?: string,
    additionalMessage?: string
  ): void {
    const messages = {
      create: itemName ? `"${itemName}" created successfully` : 'Item created successfully',
      update: itemName ? `"${itemName}" updated successfully` : 'Item updated successfully',
      delete: itemName ? `"${itemName}" deleted successfully` : 'Item deleted successfully',
      duplicate: itemName ? `"${itemName}" duplicated successfully` : 'Item duplicated successfully',
      import: 'Data imported successfully',
      export: 'Data exported successfully',
      sync: 'Data synchronized successfully',
    };

    const message = messages[operation as keyof typeof messages] || `${operation} completed successfully`;
    
    this.showSuccess(
      'Success',
      additionalMessage ? `${message}. ${additionalMessage}` : message
    );
  }

  /**
   * Show validation error feedback
   * @param errors - Array of validation errors
   * @param title - Error title
   */
  static showValidationErrors(errors: string[], title: string = 'Validation Error'): void {
    const message = errors.length === 1 
      ? errors[0]
      : `Please fix the following issues:\n• ${errors.join('\n• ')}`;
    
    this.showError(title, message);
  }

  // ==========================================
  // FEEDBACK QUEUE MANAGEMENT
  // ==========================================

  /**
   * Add feedback message to queue
   * @param message - Feedback message
   */
  private static addFeedbackMessage(message: FeedbackMessage): void {
    feedbackQueue.push(message);
    this.notifyListeners();

    // Auto-remove non-permanent messages
    if (message.duration !== 'permanent') {
      const timeout = message.duration === 'short' ? 3000 : 5000;
      setTimeout(() => {
        this.removeFeedbackMessage(message.id);
      }, timeout);
    }
  }

  /**
   * Remove feedback message from queue
   * @param messageId - Message ID
   */
  private static removeFeedbackMessage(messageId: string): void {
    feedbackQueue = feedbackQueue.filter(msg => msg.id !== messageId);
    this.notifyListeners();
  }

  /**
   * Get all feedback messages
   * @returns Array of feedback messages
   */
  static getFeedbackMessages(): FeedbackMessage[] {
    return [...feedbackQueue];
  }

  /**
   * Clear all feedback messages
   */
  static clearAllFeedback(): void {
    feedbackQueue = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to feedback updates
   * @param listener - Listener function
   * @returns Unsubscribe function
   */
  static subscribeFeedback(listener: (messages: FeedbackMessage[]) => void): () => void {
    feedbackListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      feedbackListeners = feedbackListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of feedback changes
   */
  private static notifyListeners(): void {
    feedbackListeners.forEach(listener => {
      try {
        listener([...feedbackQueue]);
      } catch (error) {
        console.error('Error in feedback listener:', error);
      }
    });
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  /**
   * Generate unique ID
   * @returns Unique ID string
   */
  private static generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Test feedback system (development only)
   */
  static testFeedback(): void {
    console.log('Testing feedback system...');
    
    this.showSuccess('Test Success', 'This is a test success message');
    
    setTimeout(() => {
      this.showWarning('Test Warning', 'This is a test warning message');
    }, 1000);
    
    setTimeout(() => {
      this.showError('Test Error', 'This is a test error message');
    }, 2000);
    
    setTimeout(() => {
      this.showInfo('Test Info', 'This is a test info message');
    }, 3000);
  }
}