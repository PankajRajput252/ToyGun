import React, { useState, useEffect } from 'react';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: any;
  isLoading?: boolean;
  error?: string;
}

export default function AdminModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData = {},
  isLoading = false,
  error
}: AdminModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      const initialFormData: any = {};
      fields.forEach(field => {
        if (initialData && Object.prototype.hasOwnProperty.call(initialData, field.name)) {
          const value = initialData[field.name];
          initialFormData[field.name] = value ?? '';
        } else {
          initialFormData[field.name] = '';
        }
      });
      setFormData(initialFormData);
      setValidationErrors({});
    }
  }, [isOpen, initialData, fields]);

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    fields.forEach(field => {
      const fieldValue = formData && formData[field.name];
      if (field.required && (!fieldValue || fieldValue === '')) {
        errors[field.name] = `${field.label} is required`;
      }

      if (field.type === 'number' && fieldValue !== '') {
        const numValue = parseFloat(fieldValue);
        if (isNaN(numValue)) {
          errors[field.name] = `${field.label} must be a valid number`;
        } else {
          if (field.min !== undefined && numValue < field.min) {
            errors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            errors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  const renderField = (field: FormField) => {
    const hasError = validationErrors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <select
            name={field.name}
            value={(formData && formData[field.name]) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={field.name}
              checked={(formData && formData[field.name]) || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={(formData && formData[field.name]) || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            required={field.required}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-black to-yellow-500 rounded-t-lg">
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>

        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* BODY */}
      <div className="p-6">

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {renderField(field)}

              {validationErrors[field.name] && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors[field.name]}
                </p>
              )}
            </div>
          ))}

          {/* ACTION BUTTONS */}
          <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
    
}
