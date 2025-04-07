
import { toast as sonnerToast } from 'sonner';

// Store to track active toast messages
const activeToasts = new Map<string, string>();

// Helper to get a key for a toast message
const getToastKey = (message: string) => message.toLowerCase().trim();

/**
 * Helper function to ensure no duplicate sonner toasts are displayed
 */
export const uniqueToast = {
  success: (message: string, options?: any) => {
    const key = getToastKey(message);
    
    if (activeToasts.has(key)) {
      return; // Don't show duplicate toast
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    activeToasts.set(key, id);
    
    return sonnerToast.success(message, {
      ...options,
      id,
      onDismiss: () => {
        activeToasts.delete(key);
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    });
  },
  
  error: (message: string, options?: any) => {
    const key = getToastKey(message);
    
    if (activeToasts.has(key)) {
      return; // Don't show duplicate toast
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    activeToasts.set(key, id);
    
    return sonnerToast.error(message, {
      ...options,
      id,
      onDismiss: () => {
        activeToasts.delete(key);
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    });
  },
  
  info: (message: string, options?: any) => {
    const key = getToastKey(message);
    
    if (activeToasts.has(key)) {
      return; // Don't show duplicate toast
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    activeToasts.set(key, id);
    
    return sonnerToast.info(message, {
      ...options,
      id,
      onDismiss: () => {
        activeToasts.delete(key);
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    });
  },
  
  warning: (message: string, options?: any) => {
    const key = getToastKey(message);
    
    if (activeToasts.has(key)) {
      return; // Don't show duplicate toast
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    activeToasts.set(key, id);
    
    return sonnerToast.warning(message, {
      ...options,
      id,
      onDismiss: () => {
        activeToasts.delete(key);
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    });
  },
  
  // For custom toast usage that doesn't fit the above methods
  custom: (render: () => React.ReactNode, options?: any, message?: string) => {
    const key = message ? getToastKey(message) : Math.random().toString();
    
    if (message && activeToasts.has(key)) {
      return; // Don't show duplicate toast
    }
    
    const id = Math.random().toString(36).substr(2, 9);
    if (message) activeToasts.set(key, id);
    
    return sonnerToast.custom(render, {
      ...options,
      id,
      onDismiss: () => {
        if (message) activeToasts.delete(key);
        if (options?.onDismiss) {
          options.onDismiss();
        }
      }
    });
  }
};
