/**
 * useConfirmation Hook for PourCost-RN
 * Provides a React hook interface for showing confirmation dialogs
 * Manages dialog state and integrates with FeedbackService
 */

import { useState } from 'react';
import { FeedbackService, ConfirmationOptions } from '@/src/services/feedback-service';

interface UseConfirmationOptions {
  defaultDestructive?: boolean;
  defaultConfirmText?: string;
  defaultCancelText?: string;
}

interface ConfirmationState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  icon?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading: boolean;
}

/**
 * Hook for managing confirmation dialogs
 */
export const useConfirmation = (options: UseConfirmationOptions = {}) => {
  const {
    defaultDestructive = false,
    defaultConfirmText = 'Confirm',
    defaultCancelText = 'Cancel',
  } = options;

  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    visible: false,
    title: '',
    message: '',
    confirmText: defaultConfirmText,
    cancelText: defaultCancelText,
    destructive: defaultDestructive,
    onConfirm: () => {},
    loading: false,
  });

  /**
   * Show confirmation dialog
   */
  const showConfirmation = (confirmationOptions: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    icon?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    setConfirmationState({
      visible: true,
      title: confirmationOptions.title,
      message: confirmationOptions.message,
      confirmText: confirmationOptions.confirmText || defaultConfirmText,
      cancelText: confirmationOptions.cancelText || defaultCancelText,
      destructive: confirmationOptions.destructive || defaultDestructive,
      icon: confirmationOptions.icon,
      onConfirm: confirmationOptions.onConfirm,
      onCancel: confirmationOptions.onCancel,
      loading: false,
    });
  };

  /**
   * Hide confirmation dialog
   */
  const hideConfirmation = () => {
    setConfirmationState(prev => ({
      ...prev,
      visible: false,
      loading: false,
    }));
  };

  /**
   * Handle confirmation action
   */
  const handleConfirm = async () => {
    setConfirmationState(prev => ({ ...prev, loading: true }));
    
    try {
      await confirmationState.onConfirm();
      hideConfirmation();
    } catch (error) {
      setConfirmationState(prev => ({ ...prev, loading: false }));
      FeedbackService.handleError(error instanceof Error ? error : String(error));
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    confirmationState.onCancel?.();
    hideConfirmation();
  };

  /**
   * Show delete confirmation dialog
   */
  const showDeleteConfirmation = (
    itemName: string,
    onConfirm: () => void | Promise<void>,
    itemType: string = 'item'
  ) => {
    showConfirmation({
      title: `Delete ${itemType}`,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      destructive: true,
      icon: 'trash',
      onConfirm,
    });
  };

  /**
   * Show bulk delete confirmation dialog
   */
  const showBulkDeleteConfirmation = (
    count: number,
    itemType: string,
    onConfirm: () => void | Promise<void>
  ) => {
    showConfirmation({
      title: `Delete ${count} ${itemType}s`,
      message: `Are you sure you want to delete ${count} ${itemType}s? This action cannot be undone.`,
      confirmText: 'Delete All',
      destructive: true,
      icon: 'trash',
      onConfirm,
    });
  };

  /**
   * Show unsaved changes confirmation
   */
  const showUnsavedChangesConfirmation = (
    onConfirm: () => void | Promise<void>,
    customMessage?: string
  ) => {
    showConfirmation({
      title: 'Unsaved Changes',
      message: customMessage || 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
      confirmText: 'Leave',
      cancelText: 'Stay',
      destructive: true,
      icon: 'warning',
      onConfirm,
    });
  };

  /**
   * Show reset confirmation
   */
  const showResetConfirmation = (
    onConfirm: () => void | Promise<void>,
    itemType: string = 'data'
  ) => {
    showConfirmation({
      title: `Reset ${itemType}`,
      message: `Are you sure you want to reset all ${itemType}? This will restore default settings and cannot be undone.`,
      confirmText: 'Reset',
      destructive: true,
      icon: 'refresh',
      onConfirm,
    });
  };

  /**
   * Show duplicate confirmation
   */
  const showDuplicateConfirmation = (
    itemName: string,
    onConfirm: () => void | Promise<void>,
    itemType: string = 'item'
  ) => {
    showConfirmation({
      title: `Duplicate ${itemType}`,
      message: `Create a copy of "${itemName}"?`,
      confirmText: 'Duplicate',
      destructive: false,
      icon: 'copy',
      onConfirm,
    });
  };

  /**
   * Show save confirmation (for important saves)
   */
  const showSaveConfirmation = (
    onConfirm: () => void | Promise<void>,
    message: string = 'Save your changes?'
  ) => {
    showConfirmation({
      title: 'Save Changes',
      message,
      confirmText: 'Save',
      destructive: false,
      icon: 'save',
      onConfirm,
    });
  };

  return {
    // State
    confirmationState,
    
    // Actions
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    
    // Convenience methods
    showDeleteConfirmation,
    showBulkDeleteConfirmation,
    showUnsavedChangesConfirmation,
    showResetConfirmation,
    showDuplicateConfirmation,
    showSaveConfirmation,
  };
};

export default useConfirmation;