/**
 * ItemForm component - Form for creating and editing items.
 *
 * This component demonstrates:
 * - Controlled form inputs with useState
 * - Form validation
 * - Handling both create and edit modes
 * - Redux dispatch for async operations
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import { createItem, updateItem, clearError } from '../../store/itemsSlice';
import { Item, ItemStatus, CreateItemRequest, UpdateItemRequest } from '../../types/items';

interface ItemFormProps {
  item?: Item | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.items);
  const { t } = useTranslation();

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [status, setStatus] = useState<ItemStatus>(item?.status || 'draft');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditMode = !!item;

  useEffect(() => {
    // Reset form when item changes
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setStatus(item.status);
    } else {
      setName('');
      setDescription('');
      setStatus('draft');
    }
  }, [item]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setValidationError(t('items.validation.nameRequired'));
      return false;
    }
    if (name.length > 255) {
      setValidationError(t('items.validation.nameTooLong'));
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && item) {
        const data: UpdateItemRequest = {
          name: name.trim(),
          description: description.trim(),
          status,
        };
        await dispatch(updateItem({ id: item.id, data })).unwrap();
      } else {
        const data: CreateItemRequest = {
          name: name.trim(),
          description: description.trim(),
          status,
        };
        await dispatch(createItem(data)).unwrap();
      }
      onSuccess();
    } catch (err) {
      // Error is handled by Redux slice
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">
          {isEditMode ? t('items.form.editTitle') : t('items.form.createTitle')}
        </h2>
      </div>

      {/* Error messages */}
      {(error || validationError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {validationError || error}
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-1">
          {t('items.fields.name')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          placeholder={t('items.placeholders.name')}
          maxLength={255}
          disabled={isLoading}
        />
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">
          {t('items.fields.description')}
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          placeholder={t('items.placeholders.description')}
          disabled={isLoading}
        />
      </div>

      {/* Status field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-secondary-700 mb-1">
          {t('items.fields.status')}
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ItemStatus)}
          className="w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoading}
        >
          <option value="draft">{t('items.status.draft')}</option>
          <option value="active">{t('items.status.active')}</option>
          <option value="archived">{t('items.status.archived')}</option>
        </select>
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={isLoading}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-700 border border-transparent rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('common.saving')}
            </span>
          ) : isEditMode ? (
            t('items.form.updateAction')
          ) : (
            t('items.form.createAction')
          )}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
