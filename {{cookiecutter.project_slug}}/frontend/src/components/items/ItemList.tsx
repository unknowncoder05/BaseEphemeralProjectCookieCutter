/**
 * ItemList component - Displays a list of items with filtering.
 *
 * This component demonstrates:
 * - Redux state consumption with useSelector
 * - Redux dispatch with useDispatch
 * - Filter state management
 * - Loading and error states
 * - Mapping over data to render child components
 */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store';
import {
  fetchItems,
  deleteItem,
  archiveItem,
  activateItem,
  clearError,
} from '../../store/itemsSlice';
import { ItemStatus } from '../../types/items';
import ItemCard from './ItemCard';
import { Button, EmptyState, Skeleton } from '../shared';

interface ItemListProps {
  onViewItem: (id: number) => void;
  onCreateItem: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({ onViewItem, onCreateItem }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, isLoading, error } = useSelector((state: RootState) => state.items);
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      // Auto-clear error after 5 seconds
      const timeout = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, dispatch]);

  const handleArchive = async (id: number) => {
    if (window.confirm(t('items.confirm.archive'))) {
      await dispatch(archiveItem(id));
    }
  };

  const handleActivate = async (id: number) => {
    await dispatch(activateItem(id));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('items.confirm.delete'))) {
      await dispatch(deleteItem(id));
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-secondary-800 rounded-lg shadow-md p-4 border border-secondary-200 dark:border-secondary-700">
            <div className="flex justify-between mb-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('items.title')}</h1>
        <Button
          onClick={onCreateItem}
        >
          {t('items.form.createAction')}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {t('items.filters.status')}
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
          className="border border-secondary-300 dark:border-secondary-600 rounded-md px-3 py-1.5 text-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
        >
          <option value="all">{t('items.filters.all')}</option>
          <option value="draft">{t('items.status.draft')}</option>
          <option value="active">{t('items.status.active')}</option>
          <option value="archived">{t('items.status.archived')}</option>
        </select>
      </div>

      {/* Items grid */}
      {filteredItems.length === 0 ? (
        <EmptyState 
          title={items.length === 0 ? t('items.empty.noneTitle') : t('items.empty.filteredTitle')}
          description={items.length === 0 ? t('items.empty.noneDescription') : t('items.empty.filteredDescription')}
          action={items.length === 0 ? <Button onClick={onCreateItem}>{t('items.form.createAction')}</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onView={onViewItem}
              onArchive={handleArchive}
              onActivate={handleActivate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Loading overlay for subsequent loads */}
      {isLoading && items.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="pm-surface-panel p-4 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm pm-text-muted">{t('app.loading')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;
