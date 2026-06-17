import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import FilterBar from '@/components/FilterBar';
import StatCard from '@/components/StatCard';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import {
  Flame,
  Clock,
  Plane,
  Wrench,
  AlertTriangle,
  X,
  BarChart3,
  Users,
  Activity,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Rocket,
  Loader2,
} from 'lucide-react';
import type {
  FaultStatistics,
  HeatmapData,
  TopFault,
  RepeatAircraft,
  CommonAction,
  FaultDrillDownData,
} from '../../shared/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';

export default function FaultHeatmap() {
  const { filters } = useAppStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<FaultStatistics | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);
  const [topFaults, setTopFaults] = useState<TopFault[]>([]);
  const [repeatAircraft, setRepeatAircraft] = useState<RepeatAircraft[]>([]);
  const [commonActions, setCommonActions] = useState<CommonAction[]>([]);
  const [drillDown, setDrillDown] = useState<FaultDrillDownData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [initiateMsg, setInitiateMsg] = useState<string | null>(null);

  const baseParams = {
    aircraftType: filters.aircraftType,
    base: filters.base,
    ataChapter: filters.ataChapter,
    season: filters.season,
    faultCode: filters.faultCode,
    dateStart: filters.dateRange.start,
    dateEnd: filters.dateRange.end,
  };

  useEffect(() => {
    Promise.all([
      api.getFaultStatistics(baseParams),
      api.getHeatmapData(baseParams),
      api.getTopFaults(baseParams),
      api.getRepeatAircraft(baseParams),
      api.getCommonActions(baseParams),
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

  async function openDrillDown(faultCode: string) {
    setLoadingDrill(true);
    setShowModal(true);
    setDrillDown(null);
    setInitiateMsg(null);
    try {
      const data = await api.getFaultDrillDown(baseParams, faultCode);
      setDrillDown(data);
    } finally {
      setLoadingDrill(false);
    }
  }

  async function openDrillDownByAta(ataChapter: string) {
    setLoadingDrill(true);
    setShowModal(true);
    setDrillDown(null);
    setInitiateMsg(null);
    try {
      const topFault = await api.getTopFaultByAta(baseParams, ataChapter);
      if (topFault) {
        const data = await api.getFaultDrillDown(baseParams, topFault.faultCode);
        setDrillDown(data);
      } else {
        setLoadingDrill(false);
        setShowModal(false);
      }
    } finally {
      setLoadingDrill(false);
    }
  }

  async function handleInitiateReview() {
    if (!drillDown) return;
    setInitiating(true);
    setInitiateMsg(null);
    try {
      const result = await api.initiateReviewFromDrilldown(
        baseParams,
        drillDown.faultCode,
        drillDown.reviewReason
      );
      setInitiateMsg(result.message);
      if (result.created) {
        setTimeout(() => {
          closeModal();
          navigate('/review-checklist');
        }, 1200);
      }
    } finally {
      setInitiating(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setDrillDown(null);
    setInitiateMsg(null);
  }

  const trendMax = Math.max(
    ...(stats?.faultTrend?.map((t) => t.count) || [0]),
    1
  );

  return (
    <Layout title="故障热力" subtitle={`${filters.dateRange.start} 至 ${filters.dateRange.end} 故障分布与趋势分析`}>
      <div className="space-y-6">
        <FilterBar />

        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="故障总次数"
            value={stats?.totalFaults || 0}
            unit="次"
            icon={<Flame className="w-4 h-4" />}
            trend={stats ? Math.round((stats.faultTrend?.[stats.faultTrend.length - 1]?.count || 0) / (stats.faultTrend?.[0]?.count || 1) * 100 - 100) : 0}
            trendLabel="期间环比"
            gradient="from-alert-orange-500/20 to-alert-orange-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="平均停场时间"
            value={stats?.avgDowntime || 0}
            unit="小时"
            icon={<Clock className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="重复故障飞机"
            value={stats?.repeatAircraftCount || 0}
            unit="架"
            icon={<Plane className="w-4 h-4" />}
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

        {stats?.faultTrend && stats.faultTrend.length > 0 && (
          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-tech-cyan-400" />
              <h3 className="text-white font-semibold">期间故障趋势</h3>
              <span className="text-xs text-slate-400 ml-auto">
                {filters.dateRange.start} ~ {filters.dateRange.end}
              </span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={stats.faultTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={[0, trendMax * 1.2]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-tech-cyan-400" />
                  ATA 章节故障热力图
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">点击色块可钻取章节内TOP故障详情</p>
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
                  onClick={() => openDrillDownByAta(item.ataChapter)}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:z-10 ${getHeatColor(
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
                    <div className="text-tech-cyan-400 mt-1 flex items-center gap-1 text-[11px]">
                      点击钻取 <ChevronRight className="w-3 h-3" />
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
              <span className="text-xs text-tech-cyan-400 ml-auto flex items-center gap-1">
                点击钻取详情 <ChevronRight className="w-3 h-3" />
              </span>
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
                    <th className="pb-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {topFaults.map((fault, idx) => (
                    <tr
                      key={fault.faultCode}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => openDrillDown(fault.faultCode)}
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
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          钻取 <ChevronRight className="w-3 h-3" />
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
                  onClick={() => openDrillDown(ac.faultCode)}
                  className="p-3.5 rounded-xl bg-deep-blue-700/40 border border-white/5 hover:border-alert-orange-500/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-semibold">{ac.aircraftReg}</span>
                        <span className="px-1.5 py-0.5 rounded bg-deep-blue-600/60 text-[10px] text-slate-300 font-mono flex-shrink-0">
                          {ac.aircraftType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1.5 line-clamp-1">
                        {ac.faultCode} · {ac.faultDescription}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
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

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-deep-blue-800 border border-white/10 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-start justify-between p-6 border-b border-white/5 bg-gradient-to-r from-deep-blue-800 to-deep-blue-700/50">
                <div>
                  {drillDown && (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-lg text-tech-cyan-400 bg-tech-cyan-500/10 px-3 py-1 rounded-lg border border-tech-cyan-500/20">
                          {drillDown.faultCode}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-deep-blue-600/60 text-xs text-slate-300 font-mono">
                          {drillDown.ataChapter}
                        </span>
                        {drillDown.needReview && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-alert-orange-500/15 text-alert-orange-400 border border-alert-orange-500/25">
                            <AlertCircle className="w-3.5 h-3.5" />
                            建议纳入复盘
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white">{drillDown.faultDescription}</h2>
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Flame className="w-4 h-4 text-alert-orange-400" />
                          期间发生 <strong className="text-white font-mono">{drillDown.totalCount}</strong> 次
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-4 h-4 text-tech-cyan-400" />
                          平均停场 <strong className="text-white font-mono">{drillDown.avgDowntime}h</strong>
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Users className="w-4 h-4 text-blue-400" />
                          涉及 <strong className="text-white font-mono">{drillDown.involvedAircraft.length}</strong> 架飞机
                        </span>
                      </div>
                      {drillDown.needReview && (
                        <div className="mt-3 p-3 rounded-xl bg-alert-orange-500/10 border border-alert-orange-500/20">
                          <p className="text-sm text-alert-orange-300">
                            <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                            <strong>复盘原因：</strong>{drillDown.reviewReason}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {initiateMsg && (
                    <span className={`text-xs px-3 py-1.5 rounded-lg border ${
                      initiateMsg.includes('已在')
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
                        : 'bg-tech-cyan-500/10 text-tech-cyan-400 border-tech-cyan-500/25'
                    }`}>
                      {initiateMsg}
                    </span>
                  )}
                  {drillDown && (
                    <button
                      onClick={handleInitiateReview}
                      disabled={initiating || initiateMsg?.includes('已在')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-alert-orange-500 to-alert-orange-600 text-white shadow-lg shadow-alert-orange-500/20 hover:from-alert-orange-400 hover:to-alert-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {initiating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      发起复盘
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDrill ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-slate-400 animate-pulse">加载钻取数据中...</div>
                  </div>
                ) : drillDown ? (
                  <>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-tech-cyan-400" />
                          月度趋势（次数 + 平均停场）
                        </h4>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={drillDown.monthlyTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                              <Bar yAxisId="left" dataKey="count" name="故障次数" fill="#FF6B35" radius={[4, 4, 0, 0]} opacity={0.85} />
                              <Line yAxisId="right" type="monotone" dataKey="avgDowntime" name="平均停场h" stroke="#00D4AA" strokeWidth={2.5} dot={{ fill: '#00D4AA', r: 4 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-alert-orange-400" />
                          停场时间分布
                        </h4>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={drillDown.downtimeDistribution}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
                              <Bar dataKey="count" name="次数" fill="#FF6B35" radius={[6, 6, 0, 0]} opacity={0.8}>
                                {drillDown.downtimeDistribution.map((_, i) => (
                                  <rect key={i} fill={i >= 3 ? '#e63706' : '#FF6B35'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        涉及飞机明细（{drillDown.involvedAircraft.length} 架）
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                              <th className="pb-3 font-medium">机号</th>
                              <th className="pb-3 font-medium">机型</th>
                              <th className="pb-3 font-medium text-right">故障次数</th>
                              <th className="pb-3 font-medium text-right">累计停场</th>
                              <th className="pb-3 font-medium">最近发生</th>
                              <th className="pb-3 font-medium">风险等级</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drillDown.involvedAircraft.slice(0, 8).map((ac) => (
                              <tr key={ac.aircraftReg} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-2.5 font-mono text-white font-medium">{ac.aircraftReg}</td>
                                <td className="py-2.5 text-slate-300">{ac.aircraftType}</td>
                                <td className="py-2.5 text-right font-mono text-white font-semibold">{ac.count}</td>
                                <td className="py-2.5 text-right font-mono text-slate-300">{ac.totalDowntime}h</td>
                                <td className="py-2.5 text-slate-400 text-xs">{ac.lastOccurrence}</td>
                                <td className="py-2.5">
                                  {ac.count >= 4 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-alert-orange-500/15 text-alert-orange-400 border border-alert-orange-500/25">
                                      <XCircle className="w-3 h-3" /> 高
                                    </span>
                                  ) : ac.count >= 2 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                      中
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25">
                                      <CheckCircle2 className="w-3 h-3" /> 低
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-tech-cyan-400" />
                        处理动作明细
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                              <th className="pb-3 font-medium">排故动作</th>
                              <th className="pb-3 font-medium text-right">使用次数</th>
                              <th className="pb-3 font-medium text-right">成功次数</th>
                              <th className="pb-3 font-medium text-right">成功率</th>
                              <th className="pb-3 font-medium text-right">平均耗时</th>
                              <th className="pb-3 font-medium w-40">效果评估</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drillDown.actionDetails.map((ad, i) => (
                              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-2.5 text-slate-200">{ad.action}</td>
                                <td className="py-2.5 text-right font-mono text-white">{ad.count}</td>
                                <td className="py-2.5 text-right font-mono text-tech-cyan-400">{ad.successCount}</td>
                                <td className="py-2.5 text-right">
                                  <span className={`font-mono font-semibold ${
                                    ad.successRate >= 80 ? 'text-tech-cyan-400' :
                                    ad.successRate >= 60 ? 'text-yellow-400' : 'text-alert-orange-400'
                                  }`}>
                                    {ad.successRate}%
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono text-slate-300">{ad.avgDowntime}h</td>
                                <td className="py-2.5">
                                  <div className="h-2 bg-deep-blue-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        ad.successRate >= 80
                                          ? 'bg-gradient-to-r from-tech-cyan-400 to-tech-cyan-500'
                                          : ad.successRate >= 60
                                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                          : 'bg-gradient-to-r from-alert-orange-400 to-alert-orange-500'
                                      }`}
                                      style={{ width: `${ad.successRate}%` }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
