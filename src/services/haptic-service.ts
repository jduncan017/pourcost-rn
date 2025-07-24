/**
 * Haptic Feedback Service for PourCost-RN
 * Provides tactile feedback for user interactions
 * Enhances user experience with subtle vibrations
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Haptic feedback service class
 */
export class HapticService {
  
  // Enable/disable haptics based on user preference
  private static enabled = true;
  
  /**
   * Enable or disable haptic feedback
   * @param enabled - Whether haptics should be enabled
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Check if haptics are enabled
   * @returns Whether haptics are enabled
   */
  static isEnabled(): boolean {
    return this.enabled && Platform.OS !== 'web';
  }
  
  /**
   * Trigger haptic feedback
   * @param type - Type of haptic feedback
   */
  static trigger(type: HapticType): void {
    if (!this.isEnabled()) return;
    
    try {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Silently fail if haptics are not supported
      console.warn('Haptic feedback failed:', error);
    }
  }
  
  // Convenience methods for common interactions
  
  /**
   * Button press feedback
   */
  static buttonPress(): void {
    this.trigger('light');
  }
  
  /**
   * Toggle switch feedback
   */
  static toggle(): void {
    this.trigger('medium');
  }
  
  /**
   * Delete action feedback
   */
  static delete(): void {
    this.trigger('heavy');
  }
  
  /**
   * Success action feedback
   */
  static success(): void {
    this.trigger('success');
  }
  
  /**
   * Error action feedback
   */
  static error(): void {
    this.trigger('error');
  }
  
  /**
   * Selection/scroll feedback
   */
  static selection(): void {
    this.trigger('selection');
  }
  
  /**
   * Navigation feedback
   */
  static navigation(): void {
    this.trigger('light');
  }
}

export default HapticService;