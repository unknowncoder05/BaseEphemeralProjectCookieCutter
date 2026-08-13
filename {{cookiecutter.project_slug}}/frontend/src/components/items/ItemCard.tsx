/**
 * ItemCard component - Displays a single item in a card format.
 *
 * This component demonstrates:
 * - TypeScript props interface
 * - Conditional rendering based on status
 * - Event handler props for actions
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ItemListItem, ItemStatus } from '../../types/items';
import { Card, Badge, Button } from '../shared';

interface ItemCardProps {
  item: ItemListItem;
  onView: (id: number) => void;
  onArchive: (id: number) => void;
  onActivate: (id: number) => void;
  onDelete: (id: number) => void;
}

const statusVariants: Record<ItemStatus, 'secondary' | 'primary' | 'info'> = {
  draft: 'secondary',
  active: 'primary',
  archived: 'info',
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onView,
  onArchive,
  onActivate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="p-4" hoverable>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white truncate flex-1">
          {item.name}
        </h3>
        <Badge variant={statusVariants[item.status]} className="ml-2">
          {t(`items.status.${item.status}`)}
        </Badge>
      </div>

      <div className="text-sm text-secondary-500 dark:text-secondary-300 mb-4">
        <p>{t('items.card.by', { owner: item.owner_name })}</p>
        <p>{t('items.card.created', { date: formatDate(item.created_at) })}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onView(item.id)}
        >
          {t('common.view')}
        </Button>

        {item.status !== 'archived' && (
          <Button
            size="sm"
            onClick={() => onArchive(item.id)}
          >
            {t('common.archive')}
          </Button>
        )}

        {item.status !== 'active' && (
          <Button
            size="sm"
            onClick={() => onActivate(item.id)}
          >
            {t('common.activate')}
          </Button>
        )}

        <Button
          size="sm"
          variant="danger"
          onClick={() => onDelete(item.id)}
        >
          {t('common.delete')}
        </Button>
      </div>
    </Card>
  );
};

export default ItemCard;
