import { useEffect, useState } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import type { OptionItem } from '../../shared/types';

interface Props {
  showDateRange?: boolean;
}

export default function FilterBar({ showDateRange = true }: Props) {
  const { filters, setFilter, resetFilters } = useAppStore();
  const [options, setOptions] = useState<{
    aircraftTypes: OptionItem[];
    bases: OptionItem[];
    ataChapters: OptionItem[];
    seasons: OptionItem[];
    faultCodes: OptionItem[];
  }>({
    aircraftTypes: [],
    bases: [],
    ataChapters: [],
    seasons: [],
    faultCodes: [],
  });

  useEffect(() => {
    Promise.all([
      api.getAircraftTypes(),
      api.getBases(),
      api.getAtaChapters(),
      api.getSeasons(),
      api.getFaultCodes(),
    ]).then(([aircraftTypes, bases, ataChapters, seasons, faultCodes]) => {
      setOptions({ aircraftTypes, bases, ataChapters, seasons, faultCodes });
    });
  }, []);

  const selectClass =
    'bg-deep-blue-700/60 border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tech-cyan-500/40 focus:border-tech-cyan-500/40 min-w-[140px]';

  return (
    <div className="bg-deep-blue-800/50 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-1">
      <div className="flex flex-wrap items-center gap-4">
        <SelectField
          label="机型"
          value={filters.aircraftType || ''}
          onChange={(v) => setFilter('aircraftType', v || null)}
          options={options.aircraftTypes}
          className={selectClass}
        />
        <SelectField
          label="基地"
          value={filters.base || ''}
          onChange={(v) => setFilter('base', v || null)}
          options={options.bases}
          className={selectClass}
        />
        <SelectField
          label="ATA章节"
          value={filters.ataChapter || ''}
          onChange={(v) => setFilter('ataChapter', v || null)}
          options={options.ataChapters}
          className={selectClass}
        />
        <SelectField
          label="季节"
          value={filters.season || ''}
          onChange={(v) => setFilter('season', v || null)}
          options={options.seasons}
          className={selectClass}
        />
        <SelectField
          label="故障代码"
          value={filters.faultCode || ''}
          onChange={(v) => setFilter('faultCode', v || null)}
          options={options.faultCodes}
          className={selectClass}
        />
        {showDateRange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">时间范围</span>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilter('dateRange', { ...filters.dateRange, start: e.target.value })
              }
              className={selectClass + ' min-w-[130px]'}
            />
            <span className="text-slate-500">至</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilter('dateRange', { ...filters.dateRange, end: e.target.value })
              }
              className={selectClass + ' min-w-[130px]'}
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm text-white bg-tech-cyan-600 hover:bg-tech-cyan-500 transition-colors shadow-lg shadow-tech-cyan-600/20">
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: OptionItem[];
  className: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 whitespace-nowrap">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
        <option value="">全部</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
