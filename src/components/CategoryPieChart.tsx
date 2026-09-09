import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatRupiah } from '../services/transactionParser';
import { CategoryIcon } from './CategoryIcon';
import { ChevronRight, Info } from 'lucide-react';

export interface CategoryBreakdownItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  totalExpense: number;
  onSelectCategory: (categoryName: string) => void;
}

// Sophisticated, vibrant, distinct color palette for financial chart
const CHART_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Rose/Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#D946EF', // Fuchsia
  '#64748B', // Slate
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  totalExpense,
  onSelectCategory,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0 || totalExpense === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
        <p className="text-xs font-semibold">Belum ada catatan pengeluaran pada periode ini.</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Catat pengeluaran baru untuk melihat grafik proporsi kategori.
        </p>
      </div>
    );
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryBreakdownItem;
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700/80 z-50 pointer-events-none">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: payload[0].color }}
            />
            {item.name}
          </p>
          <p className="font-black font-mono text-emerald-400 text-sm mt-1">
            {formatRupiah(item.amount)}
          </p>
          <div className="flex items-center justify-between gap-4 mt-1 text-[10px] text-slate-300">
            <span>{item.count} Transaksi</span>
            <span className="font-bold text-amber-300">{item.percentage}%</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 border-t border-slate-800 pt-1 text-center font-medium">
            💡 Klik untuk melihat detail transaksi
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Pie Chart Canvas Container */}
      <div className="relative w-full h-60 sm:h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              onClick={(entry) => onSelectCategory(entry.name)}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer outline-none transition-all duration-300"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={activeIndex === index ? 3 : 1.5}
                  style={{
                    filter: activeIndex === index ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' : 'none',
                    transform: activeIndex === index ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: 'center center',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Beban
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-slate-900 leading-tight">
            {formatRupiah(totalExpense)}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold mt-0.5">
            {data.length} Kategori
          </span>
        </div>
      </div>

      {/* Interactive Helper Prompt */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1.5 font-medium text-emerald-700">
          <Info size={13} /> Klik pada bagian diagram atau daftar untuk rincian
        </span>
        <span className="text-slate-400 font-mono text-[10px]">
          {data.reduce((sum, item) => sum + item.count, 0)} total transaksi
        </span>
      </div>

      {/* Category List & Transaction Count (Clickable Rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {data.map((cat, index) => {
          const color = CHART_COLORS[index % CHART_COLORS.length];
          const isHovered = activeIndex === index;

          return (
            <button
              key={`${cat.name}-${index}`}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 active:scale-98 group cursor-pointer ${
                isHovered
                  ? 'bg-slate-100/90 border-slate-300 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Color Dot & Icon */}
                <div className="relative shrink-0">
                  <div
                    className="w-3 h-3 rounded-full shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                </div>

                <CategoryIcon categoryName={cat.name} type="expense" size={16} />

                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="px-1.5 py-0.2 bg-white rounded-md border border-slate-200 font-semibold text-slate-600">
                      {cat.count} transaksi
                    </span>
                    <span className="font-bold text-slate-600">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-right">
                <span className="text-xs font-black font-mono text-slate-900">
                  {formatRupiah(cat.amount)}
                </span>
                <ChevronRight
                  size={14}
                  className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
