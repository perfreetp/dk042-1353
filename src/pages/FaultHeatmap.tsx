import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import StatCard from '@/components/StatCard';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { Flame, Clock, Plane, Wrench, AlertTriangle } from 'lucide-react';
import type {
  FaultStatistics,
  HeatmapData,
  TopFault,
  RepeatAircraft,
  CommonAction,
} from '../../shared/types';

export default function FaultHeatmap() {
  const { filters } = useAppStore();
  const [stats, setStats] = useState<FaultStatistics | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [topFaults, setTopFaults] = useState<TopFault[]>([]);
  const [repeatAircraft, setRepeatAircraft] = useState<RepeatAircraft[]>([]);
  const [commonActions, setCommonActions] = useState<CommonAction[]>([]);

  const filterParams = {
    aircraftType: filters.aircraftType,
    base: filters.base,
    ataChapter: filters.ataChapter,
    season: filters.season,
    faultCode: filters.faultCode,
  };

  useEffect(() => {
    Promise.all([
      api.getFaultStatistics(filterParams),
      api.getHeatmapData(filterParams),
      api.getTopFaults(filterParams),
      api.getRepeatAircraft(filterParams),
      api.getCommonActions(filterParams),
    ]).then(([statsData, heatmapData, topData, aircraftData, actionsData]) => {
      setStats(statsData);
      setHeatmap(heatmapData);
      setTopFaults(topData);
      setRepeatAircraft(aircraftData);
      setCommonActions(actionsData);
    });
  }, [filters]);

  const maxCount = Math.max(...heatmap.map((h) => h.count), 1);

  function getHeatColor(count: number) {
    const ratio = count / maxCount;
    if (ratio < 0.2) return 'bg-tech-cyan-500/15 border-tech-cyan-500/20';
    if (ratio < 0.4) return 'bg-tech-cyan-500/30 border-tech-cyan-500/40';
    if (ratio < 0.6) return 'bg-alert-orange-500/25 border-alert-orange-500/35';
    if (ratio < 0.8) return 'bg-alert-orange-500/45 border-alert-orange-500/55';
    return 'bg-alert-orange-500/70 border-alert-orange-500/80';
  }

  return (
    <Layout title="故障热力" subtitle="近三个月故障分布与趋势分析">
      <div className="space-y-6">
        <FilterBar />

        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="故障总次数"
            value={stats?.totalFaults || 0}
            unit="次"
            icon={<Flame className="w-4 h-4" />}
            trend={12.5}
            trendLabel="较上季"
            gradient="from-alert-orange-500/20 to-alert-orange-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="平均停场时间"
            value={stats?.avgDowntime || 0}
            unit="小时"
            icon={<Clock className="w-4 h-4" />}
            trend={-5.2}
            trendLabel="较上季"
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="重复故障飞机"
            value={stats?.repeatAircraftCount || 0}
            unit="架"
            icon={<Plane className="w-4 h-4" />}
            trend={8.3}
            trendLabel="较上季"
            gradient="from-alert-orange-500/20 to-alert-orange-500/0"
            delay="stagger-4"
          />
          <StatCard
            title="常用处理动作"
            value={stats?.commonActionsCount || 0}
            unit="项"
            icon={<Wrench className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-5"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold">ATA 章节故障热力图</h3>
                <p className="text-slate-400 text-xs mt-0.5">颜色越深表示故障频次越高</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 rounded bg-tech-cyan-500/15 border border-tech-cyan-500/20" />
                <span>低</span>
                <div className="w-16 h-4 rounded bg-gradient-to-r from-tech-cyan-500/30 via-alert-orange-500/40 to-alert-orange-500/70" />
                <span>高</span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {heatmap.map((item) => (
                <div
                  key={item.ataChapter}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg ${getHeatColor(
                    item.count
                  )}`}
                >
                  <div className="text-xs font-mono text-white/90 font-medium">
                    {item.ataChapter}
                  </div>
                  <div className="text-[11px] text-white/70 truncate mt-0.5">
                    {item.ataChapterName.split(' ')[1]}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-white font-mono">{item.count}</span>
                    <span className="text-[10px] text-white/60">次</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-deep-blue-950 border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                    <div className="text-white font-medium">{item.ataChapterName}</div>
                    <div className="text-slate-400 mt-1">
                      故障 {item.count} 次 · 平均停场 {item.avgDowntime}h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-tech-cyan-400" />
              <h3 className="text-white font-semibold">常用处理动作</h3>
            </div>
            <div className="space-y-3">
              {commonActions.slice(0, 6).map((action, idx) => (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-200 truncate pr-2">{action.action}</span>
                    <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                      {action.successRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        action.successRate >= 80
                          ? 'bg-gradient-to-r from-tech-cyan-400 to-tech-cyan-500'
                          : action.successRate >= 60
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-alert-orange-400 to-alert-orange-500'
                      }`}
                      style={{ width: `${action.successRate}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">使用 {action.count} 次</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-alert-orange-400" />
              <h3 className="text-white font-semibold">TOP 故障排行</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                    <th className="pb-3 font-medium">排名</th>
                    <th className="pb-3 font-medium">故障代码</th>
                    <th className="pb-3 font-medium">故障描述</th>
                    <th className="pb-3 font-medium text-right">次数</th>
                    <th className="pb-3 font-medium text-right">平均停场</th>
                    <th className="pb-3 font-medium">ATA</th>
                  </tr>
                </thead>
                <tbody>
                  {topFaults.map((fault, idx) => (
                    <tr
                      key={fault.faultCode}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3">
                        <span
                          className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                            idx < 3
                              ? 'bg-alert-orange-500/20 text-alert-orange-400'
                              : 'bg-slate-600/30 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-tech-cyan-400 font-medium">
                        {fault.faultCode}
                      </td>
                      <td className="py-3 text-slate-200">{fault.faultDescription}</td>
                      <td className="py-3 text-right font-mono text-white font-semibold">
                        {fault.count}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300">
                        {fault.avgDowntime}h
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-deep-blue-700/80 text-slate-300 text-xs font-mono">
                          {fault.ataChapter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col-span-2 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-7">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-alert-orange-400" />
              <h3 className="text-white font-semibold">重复故障飞机</h3>
            </div>
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {repeatAircraft.slice(0, 8).map((ac, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-deep-blue-700/40 border border-white/5 hover:border-alert-orange-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-semibold">{ac.aircraftReg}</span>
                        <span className="px-1.5 py-0.5 rounded bg-deep-blue-600/60 text-[10px] text-slate-300 font-mono">
                          {ac.aircraftType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5 line-clamp-1">
                        {ac.faultCode} · {ac.faultDescription}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-alert-orange-400 font-bold font-mono">
                        {ac.count}
                        <span className="text-[10px] text-alert-orange-400/70 ml-0.5">次</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">{ac.lastOccurrence}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
