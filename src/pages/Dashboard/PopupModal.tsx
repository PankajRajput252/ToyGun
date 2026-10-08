import React from 'react';
import { Modal } from '../../components/ui/modal';

interface PopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  confirmText?: string;
  cancelText?: string;
  showCheckmark?: boolean;
  position?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; // New prop
}

export const PopupModal: React.FC<PopupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCheckmark = false,
  position = 'center' // Default to center
}) => {
  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500 hover:bg-green-600';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-brand-500 hover:bg-brand-600';
    }
  };

  // Position classes
  const getPositionClass = () => {
    switch (position) {
      case 'top-right':
        return 'items-start justify-end pt-4 pr-4';
      case 'top-left':
        return 'items-start justify-start pt-4 pl-4';
      case 'bottom-right':
        return 'items-end justify-end pb-4 pr-4';
      case 'bottom-left':
        return 'items-end justify-start pb-4 pl-4';
      default: // center
        return 'items-center justify-center';
    }
  };

  // Modal size based on position
  const getModalSizeClass = () => {
    return position === 'center' ? 'max-w-md' : 'max-w-sm';
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex ${getPositionClass()} z-50`}>
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${getModalSizeClass()} w-full mx-4 my-2 transform transition-all`}>
        <div className="p-6">
          {/* Close button - positioned based on location */}
          <button
            onClick={onClose}
            className={`absolute text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${
              position.includes('right') ? 'left-3' : 'right-3'
            } top-3`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header with Icon */}
          <div className="text-center mb-4">
            {showCheckmark ? (
              <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4 ${getIconColor()}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {type === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                  {type === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />}
                  {type === 'error' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
                  {type === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />}
                </svg>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              {message}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};