import React from 'react';
import {
  UtensilsCrossed,
  Coffee,
  Flame,
  Shirt,
  Baby,
  ShoppingBasket,
  Home,
  Car,
  ShoppingBag,
  Receipt,
  Smartphone,
  HeartPulse,
  Film,
  GraduationCap,
  MoreHorizontal,
  Wallet,
  Award,
  Store,
  ArrowDownLeft,
  Gift,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { getCategoryDefinition } from '../data/categories';
import { TransactionType } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Coffee,
  Flame,
  Shirt,
  Baby,
  ShoppingBasket,
  Home,
  Car,
  ShoppingBag,
  Receipt,
  Smartphone,
  HeartPulse,
  Film,
  GraduationCap,
  MoreHorizontal,
  Wallet,
  Award,
  Store,
  ArrowDownLeft,
  Gift,
  TrendingUp,
};

interface CategoryIconProps {
  categoryName: string;
  type?: TransactionType | string;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName,
  type = 'expense',
  size = 18,
  className = '',
  showBackground = true,
}) => {
  const safeType: TransactionType = type === 'income' ? 'income' : 'expense';
  const catDef = getCategoryDefinition(categoryName, safeType);
  const IconComponent = ICON_MAP[catDef.icon] || MoreHorizontal;

  if (!showBackground) {
    return (
      <span style={{ color: catDef.color }} className={`inline-flex items-center justify-center ${className}`}>
        <IconComponent size={size} />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl shrink-0 transition-transform ${className}`}
      style={{
        backgroundColor: catDef.bgLight,
        color: catDef.color,
        width: size + 16,
        height: size + 16,
      }}
      title={catDef.name}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
