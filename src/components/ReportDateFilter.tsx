import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock, Filter, Check } from 'lucide-react';
import { getLastDayOfMonth, isFullMonthRange } from '../utils/dateFilterHelper';

export type DateFilterPreset = 'today' | 'this_week' | 'this_month' | 'all' | 'custom';

interface ReportDateFilterProps {
  preset: DateFilterPreset;
  setPreset: (preset: DateFilterPreset) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  displayTitle: string;
}

export const ReportDateFilter: React.FC<ReportDateFilterProps> = ({
  preset,
  setPreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  displayTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(preset === 'custom');
  const [customMode, setCustomMode] = useState<'single' | 'range' | 'month'>('range');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Handler for quick presets
  const handleSelectPreset = (newPreset: DateFilterPreset) => {
    setPreset(newPreset);
    if (newPreset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setIsExpanded(false);
    } else if (newPreset === 'this_week') {
      const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
      setIsExpanded(false);
    } else if (newPreset === 'this_month') {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const lastDay = getLastDayOfMonth(year, month);
      const mStr = String(month).padStart(2, '0');
      setStartDate(`${year}-${mStr}-01`);
      setEndDate(`${year}-${mStr}-${String(lastDay).padStart(2, '0')}`);
      setIsExpanded(false);
    } else if (newPreset === 'all') {
      setStartDate('');
      setEndDate('');
      setIsExpanded(false);
    } else if (newPreset === 'custom') {
      setIsExpanded(true);
    }
  };

  // Handler for single date selection
  const handleSingleDateChange = (date: string) => {
    setPreset('custom');
    setStartDate(date);
    setEndDate(date);
  };

  // Handler for month picker (sets day 1 to last day of selected month)
  const handleMonthPickerChange = (yearMonthStr: string) => {
    if (!yearMonthStr) return;
    const [y, m] = yearMonthStr.split('-').map(Number);
    const lastDay = getLastDayOfMonth(y, m);
    const mStr = String(m).padStart(2, '0');
    setPreset('custom');
    setStartDate(`${y}-${mStr}-01`);
    setEndDate(`${y}-${mStr}-${String(lastDay).padStart(2, '0')}`);
  };

  const fullMonthInfo = isFullMonthRange(startDate, endDate);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Preset Tabs Bar */}
      <div className="p-1.5 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => handleSelectPreset('today')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            preset === 'today'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Hari Ini
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('this_week')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            preset === 'this_week'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          7 Hari
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('this_month')}
          className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            preset === 'this_month'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Bulan Ini
        </button>

        <button
          type="button"
          onClick={() => {
            setPreset('custom');
            setIsExpanded(!isExpanded);
          }}
          className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
            preset === 'custom'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar size={13} />
          <span>Pilih Tanggal</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('all')}
          className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
            preset === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Semua
        </button>
      </div>

      {/* Active Filter Period Banner */}
      <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-emerald-600" />
          <span className="text-slate-500 font-medium">Periode Aktif:</span>
          <span className="font-extrabold text-slate-900">
            {displayTitle}
          </span>
          {fullMonthInfo.isFullMonth && (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
              1 Bulan Penuh
            </span>
          )}
        </div>

        {!isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            Ubah Rentang &rarr;
          </button>
        )}
      </div>

      {/* Expandable Custom Date Picker Section */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Sub-modes Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCustomMode('range')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                customMode === 'range' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Rentang Tanggal
            </button>
            <button
              type="button"
              onClick={() => setCustomMode('single')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                customMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              1 Tanggal Bebas
            </button>
            <button
              type="button"
              onClick={() => setCustomMode('month')}
              className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
                customMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pilih Bulan
            </button>
          </div>

          {/* Mode 1: Rentang Tanggal (Start Date & End Date) */}
          {customMode === 'range' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Dari Tanggal:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setPreset('custom');
                      setStartDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Sampai Tanggal:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setPreset('custom');
                      setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {fullMonthInfo.isFullMonth && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>
                    Rentang mencakup dari tanggal 1 s/d akhir bulan &rarr; Tampilan otomatis menjadi:{' '}
                    <strong>{fullMonthInfo.monthName} {fullMonthInfo.year}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: 1 Tanggal Bebas (Single Date) */}
          {customMode === 'single' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Pilih Tanggal:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleSingleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Hanya menampilkan data transaksi yang terjadi pada tanggal terpilih.
              </p>
            </div>
          )}

          {/* Mode 3: Pilih Bulan (Sets day 1 to last day) */}
          {customMode === 'month' && (
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Pilih Bulan & Tahun:
              </label>
              <input
                type="month"
                value={startDate ? startDate.substring(0, 7) : ''}
                onChange={(e) => handleMonthPickerChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Otomatis memilih tanggal 1 sampai akhir bulan dan menampilkan nama bulan.
              </p>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="pt-1 flex flex-wrap items-center gap-1.5 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Pintasan:
            </span>
            <button
              type="button"
              onClick={() => {
                const year = now.getFullYear();
                const month = now.getMonth(); // previous month (0-indexed)
                const d = new Date(year, month, 1);
                const prevYear = d.getFullYear();
                const prevMonth = d.getMonth() + 1;
                const lastDay = getLastDayOfMonth(prevYear, prevMonth);
                const mStr = String(prevMonth).padStart(2, '0');
                setPreset('custom');
                setStartDate(`${prevYear}-${mStr}-01`);
                setEndDate(`${prevYear}-${mStr}-${String(lastDay).padStart(2, '0')}`);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => {
                const year = now.getFullYear();
                setPreset('custom');
                setStartDate(`${year}-01-01`);
                setEndDate(`${year}-12-31`);
              }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
            >
              Tahun Ini ({now.getFullYear()})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
