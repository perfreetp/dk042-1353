import { ArrowUp, ArrowDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  gradient?: string;
  delay?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  gradient = 'from-tech-cyan-500/20 to-tech-cyan-500/0',
  delay,
}: Props) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <div
      className={`relative bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 overflow-hidden animate-fade-in-up ${delay || ''}`}
    >
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-60`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-slate-400">{title}</span>
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-3xl font-bold text-white font-mono tracking-tight">{value}</span>
          {unit && <span className="text-sm text-slate-400">{unit}</span>}
        </div>
        {(trend !== undefined || trendLabel) && (
          <div className="flex items-center gap-1.5">
            {trend !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-md ${
                  isPositive
                    ? 'bg-alert-orange-500/15 text-alert-orange-400'
                    : isNegative
                    ? 'bg-tech-cyan-500/15 text-tech-cyan-400'
                    : 'bg-slate-500/15 text-slate-400'
                }`}
              >
                {isPositive && <ArrowUp className="w-3 h-3" />}
                {isNegative && <ArrowDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span className="text-xs text-slate-500">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
