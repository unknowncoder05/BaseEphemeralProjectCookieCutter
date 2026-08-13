/**
 * ItemsPage - Main page for managing items.
 *
 * This component demonstrates:
 * - Page-level state management for modals
 * - Routing integration with useNavigate
 * - Composition of child components
 * - Modal pattern for forms
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store';
import { fetchItem, clearSelectedItem } from '../store/itemsSlice';
import { ItemList, ItemForm } from '../components/items';
import { Navbar, Breadcrumbs, Badge, Button, Skeleton } from '../components/shared';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const ItemsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { selectedItem, isLoading } = useSelector((state: RootState) => state.items);

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Load item if ID is in URL
  useEffect(() => {
    if (id) {
      dispatch(fetchItem(parseInt(id, 10)));
      setViewMode('view');
    } else {
      dispatch(clearSelectedItem());
      setViewMode('list');
    }
  }, [id, dispatch]);

  const handleViewItem = (itemId: number) => {
    navigate(`/items/${itemId}`);
  };

  const handleCreateItem = () => {
    setViewMode('create');
  };

  const handleEditItem = () => {
    setViewMode('edit');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    navigate('/items');
  };

  const handleFormCancel = () => {
    if (viewMode === 'create') {
      setViewMode('list');
    } else {
      setViewMode('view');
    }
  };

  const handleBackToList = () => {
    dispatch(clearSelectedItem());
    navigate('/items');
  };

  // Render item detail view
  const renderItemDetail = () => {
    if (isLoading && !selectedItem) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      );
    }

    if (!selectedItem) {
      return (
        <div className="text-center py-12 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700">
          <p className="text-secondary-500 dark:text-secondary-300">{t('items.notFound')}</p>
          <Button
            onClick={handleBackToList}
            className="mt-4"
          >
            {t('items.backToList')}
          </Button>
        </div>
      );
    }

    const statusVariants: Record<string, 'primary' | 'secondary' | 'info'> = {
      active: 'primary',
      archived: 'info',
      draft: 'secondary',
    };

    return (
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6 border border-secondary-100 dark:border-secondary-700 transition-colors">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">{selectedItem.name}</h1>
            <Badge variant={statusVariants[selectedItem.status] || 'secondary'} className="mt-2">
              {t(`items.status.${selectedItem.status}`)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleBackToList}
            >
              {t('common.back')}
            </Button>
            <Button
              onClick={handleEditItem}
            >
              {t('common.edit')}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">{t('items.fields.description')}</h3>
            <p className="mt-1 text-secondary-900 dark:text-secondary-200">
              {selectedItem.description || t('items.noDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">{t('items.detail.owner')}</h3>
              <p className="mt-1 text-secondary-900 dark:text-secondary-200 font-medium">
                {selectedItem.owner.first_name} {selectedItem.owner.last_name}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">{t('items.detail.created')}</h3>
              <p className="mt-1 text-secondary-900 dark:text-secondary-200">
                {new Date(selectedItem.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {Object.keys(selectedItem.metadata).length > 0 && (
            <div className="pt-4 border-t border-secondary-100 dark:border-secondary-700">
              <h3 className="text-sm font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider mb-2">{t('items.detail.metadata')}</h3>
              <pre className="p-4 bg-secondary-50 dark:bg-secondary-900/50 rounded-lg text-xs overflow-auto text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800">
                {JSON.stringify(selectedItem.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 transition-colors">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs />
        
        <div className="pt-4">
          {viewMode === 'list' && (
            <ItemList onViewItem={handleViewItem} onCreateItem={handleCreateItem} />
          )}

          {viewMode === 'view' && renderItemDetail()}

          {(viewMode === 'create' || viewMode === 'edit') && (
            <div className="max-w-2xl mx-auto">
              <ItemForm
                item={viewMode === 'edit' ? selectedItem : null}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;
