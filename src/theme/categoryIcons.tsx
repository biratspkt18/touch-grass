// Per-category visual identity: a distinct icon and color for each spot
// category, used on filter chips, badges, and the add-spot dropdown.
// Icons come from lucide-react-native — no custom art assets.

import {
  Utensils,
  Coffee,
  Martini,
  Trees,
  Leaf,
  Telescope,
  Bike,
  Landmark,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native';

export type CategoryIconProps = {
  color: string;
  size: number;
  strokeWidth?: number;
};
export type CategoryIcon = React.ComponentType<CategoryIconProps>;

export type CategoryStyle = {
  Icon: CategoryIcon;
  /** Main hue — map pins, active chips. */
  color: string;
  /** Soft tint background for chips/badges. */
  soft: string;
  /** Readable text color on the soft tint. */
  ink: string;
  label: string;
};

const STYLES: Record<string, CategoryStyle> = {
  food: { Icon: Utensils, color: '#F97316', soft: '#FFEDD5', ink: '#9A3412', label: 'Food' },
  cafe: { Icon: Coffee, color: '#B45309', soft: '#FEF3C7', ink: '#92400E', label: 'Café' },
  bar: { Icon: Martini, color: '#A855F7', soft: '#F3E8FF', ink: '#7E22CE', label: 'Bar' },
  park: { Icon: Trees, color: '#16A34A', soft: '#DCFCE7', ink: '#166534', label: 'Park' },
  nature: { Icon: Leaf, color: '#0D9488', soft: '#CCFBF1', ink: '#115E59', label: 'Nature' },
  viewpoint: { Icon: Telescope, color: '#0EA5E9', soft: '#E0F2FE', ink: '#075985', label: 'Viewpoint' },
  activity: { Icon: Bike, color: '#EF4444', soft: '#FEE2E2', ink: '#991B1B', label: 'Activity' },
  culture: { Icon: Landmark, color: '#6366F1', soft: '#E0E7FF', ink: '#3730A3', label: 'Culture' },
  shopping: { Icon: ShoppingBag, color: '#EC4899', soft: '#FCE7F3', ink: '#9D174D', label: 'Shopping' },
  other: { Icon: Sparkles, color: '#64748B', soft: '#F1F5F9', ink: '#334155', label: 'Other' },
};

const FALLBACK: CategoryStyle = STYLES.other;

export function categoryStyle(category: string | null | undefined): CategoryStyle {
  if (!category) return FALLBACK;
  return (
    STYLES[category] ?? {
      ...FALLBACK,
      label: category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    }
  );
}
