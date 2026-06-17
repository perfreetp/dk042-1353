import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Quote,
  AlertCircle,
  Shield,
  Flame,
  Rocket,
  Loader2,
  X,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import type {
  KnowledgeEntry,
  CaseQualitySummary,
  ReviewTask,
} from '../../shared/types';

type QualityTrendPoint = { month: string; passRate: number; issueCount: number };

type TabView = 'quality_list' | 'fault_aggregate';

type AggregatedFault = {
  faultCode: string;
  faultDescription: string;
  ataChapter: string;
  relatedCases: number;
  lowSuccessCount: number;
  qualityIssueCount: number;
  hasActiveReview: boolean;
  reviewTask: ReviewTask | null;
};
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function CaseQuality() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [qualitySummaries, setQualitySummaries] = useState<CaseQualitySummary[]>([]);
  const [lowSuccess, setLowSuccess] = useState<KnowledgeEntry[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [addedEntryIds, setAddedEntryIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<TabView>('quality_list');
  const [faultDetailModal, setFaultDetailModal] = useState<string | null>(null);
  const [addingFaultCode, setAddingFaultCode] = useState<string | null>(null);

  const totalEntries = entries.length;
  const totalRefs = entries.reduce((s, e) => s + e.referenceCount, 0);
  const avgSuccess =
    totalEntries > 0
      ? Math.round(entries.reduce((s, e) => s + e.successRate, 0) / totalEntries)
      : 0;
  const totalIssues = qualitySummaries.reduce((s, c) => s + c.missingCount, 0);

  const qualityTrend: QualityTrendPoint[] = [
    { month: '1月', passRate: 82, issueCount: 11 },
    { month: '2月', passRate: 78, issueCount: 14 },
    { month: '3月', passRate: 85, issueCount: 9 },
    { month: '4月', passRate: 88, issueCount: 8 },
    { month: '5月', passRate: 86, issueCount: 10 },
    { month: '6月', passRate: 91, issueCount: 7 },
    { month: '7月', passRate: 89, issueCount: 8 },
    { month: '8月', passRate: 93, issueCount: 5 },
    { month: '9月', passRate: 90, issueCount: 6 },
    { month: '10月', passRate: 92, issueCount: 5 },
    { month: '11月', passRate: 94, issueCount: 4 },
    { month: '12月', passRate: 92, issueCount: 5 },
  ];

  useEffect(() => {
    Promise.all([
      api.getKnowledgeEntries(),
      api.getQualitySummaries(),
      api.getLowSuccessRateEntries(),
      api.getReviewTasks(),
    ]).then(([e, q, l, r]) => {
      setEntries(e);
      setQualitySummaries(q);
      setLowSuccess(l);
      setReviewTasks(r);
    });
  }, []);

  async function handleAddToReview(q: CaseQualitySummary) {
    setAddingId(q.entryId);
    setAddMsg(null);
    try {
      const result = await api.addTaskFromCaseQuality(q.entryId);
      setAddMsg(result.message);
      if (result.created) {
        const s = new Set(addedEntryIds);
        s.add(q.entryId);
        setAddedEntryIds(s);
        api.getReviewTasks().then(setReviewTasks);
      }
    } finally {
      setAddingId(null);
    }
  }

  const aggregatedFaults = useMemo<AggregatedFault[]>(() => {
    const faultMap = new Map<string, AggregatedFault>();

    entries.forEach((entry) => {
      const existing = faultMap.get(entry.faultCode);
      if (!existing) {
        const reviewTask = reviewTasks.find((t) => t.faultCode === entry.faultCode) || null;
        faultMap.set(entry.faultCode, {
          faultCode: entry.faultCode,
          faultDescription: entry.title,
          ataChapter: entry.ataChapter,
          relatedCases: 1,
          lowSuccessCount: entry.successRate < 60 ? 1 : 0,
          qualityIssueCount: 0,
          hasActiveReview: reviewTask !== null && reviewTask.status !== 'completed',
          reviewTask,
        });
      } else {
        existing.relatedCases++;
        if (entry.successRate < 60) {
          existing.lowSuccessCount++;
        }
      }
    });

    qualitySummaries.forEach((q) => {
      const existing = faultMap.get(q.faultCode);
      if (existing && q.missingCount > 0) {
        existing.qualityIssueCount++;
      }
    });

    return Array.from(faultMap.values()).sort((a, b) => {
      if (b.qualityIssueCount !== a.qualityIssueCount) return b.qualityIssueCount - a.qualityIssueCount;
      if (b.lowSuccessCount !== a.lowSuccessCount) return b.lowSuccessCount - a.lowSuccessCount;
      return b.relatedCases - a.relatedCases;
    });
  }, [entries, qualitySummaries, reviewTasks]);

  function getFaultDetail(faultCode: string) {
    const relatedCases = entries.filter((e) => e.faultCode === faultCode);
    const lowSuccessCases = relatedCases.filter((e) => e.successRate < 60);
    const qualityIssueCases = qualitySummaries.filter((q) => q.faultCode === faultCode && q.missingCount > 0);
    const reviewTask = reviewTasks.find((t) => t.faultCode === faultCode) || null;
    const aggregate = aggregatedFaults.find((a) => a.faultCode === faultCode);

    return {
      faultCode,
      faultDescription: aggregate?.faultDescription || relatedCases[0]?.title || '',
      ataChapter: aggregate?.ataChapter || relatedCases[0]?.ataChapter || '',
      relatedCases,
      lowSuccessCases,
      qualityIssueCases,
      reviewTask,
    };
  }

  async function handleAddFaultToReview(faultCode: string) {
    setAddingFaultCode(faultCode);
    setAddMsg(null);
    try {
      const qualityCase = qualitySummaries.find((q) => q.faultCode === faultCode);
      const entryId = qualityCase?.entryId || entries.find((e) => e.faultCode === faultCode)?.id;
      if (!entryId) return;

      const result = await api.addTaskFromCaseQuality(entryId);
      setAddMsg(result.message);
      if (result.created) {
        const s = new Set(addedEntryIds);
        s.add(entryId);
        setAddedEntryIds(s);
        api.getReviewTasks().then(setReviewTasks);
      }
    } finally {
      setAddingFaultCode(null);
    }
  }

  function sourceLabel(source: ReviewTask['source']) {
    const map = {
      manual: { label: '固定清单', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/25', icon: ListChecks },
      candidate: { label: '候选生成', cls: 'bg-tech-cyan-500/15 text-tech-cyan-400 border-tech-cyan-500/25', icon: Sparkles },
      drilldown: { label: '钻取发起', cls: 'bg-alert-orange-500/15 text-alert-orange-400 border-alert-orange-500/25', icon: Rocket },
      case_quality: { label: '案例质量', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25', icon: Shield },
    };
    const m = map[source];
    const Icon = m.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.cls}`}>
        <Icon className="w-3 h-3" /> {m.label}
      </span>
    );
  }

  function statusBadge(s: ReviewTask['status']) {
    const map = {
      pending: { label: '待处理', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
      in_progress: { label: '进行中', cls: 'bg-tech-cyan-500/15 text-tech-cyan-400 border-tech-cyan-500/30' },
      completed: { label: '已完成', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[s].cls}`}>
        {map[s].label}
      </span>
    );
  }

  const tabCls = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25 shadow-lg shadow-tech-cyan-500/5'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <Layout title="案例质量" subtitle="知识条目引用分析与质量检查报告">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="知识条目总数"
            value={totalEntries}
            unit="条"
            icon={<BookOpen className="w-4 h-4" />}
            trend={12}
            trendLabel="较上月"
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-1"
          />
          <StatCard
            title="累计引用次数"
            value={totalRefs}
            unit="次"
            icon={<Quote className="w-4 h-4" />}
            gradient="from-blue-500/20 to-blue-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="平均成功率"
            value={avgSuccess}
            unit="%"
            icon={<TrendingUp className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="待整改问题"
            value={totalIssues}
            unit="项"
            icon={<AlertTriangle className="w-4 h-4" />}
            gradient="from-alert-orange-500/20 to-alert-orange-500/0"
            delay="stagger-4"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-tech-cyan-400" />
              <h3 className="text-white font-semibold">引用次数与合格率趋势</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={qualityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={[70, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="issueCount" name="问题数" fill="rgba(255,107,53,0.7)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="passRate" name="合格率%" stroke="#00D4AA" strokeWidth={2.5} dot={{ fill: '#00D4AA', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-alert-orange-400" />
              <h3 className="text-white font-semibold">低成功率条目告警</h3>
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {lowSuccess.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-alert-orange-500/10 border border-alert-orange-500/20 hover:border-alert-orange-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-slate-100 line-clamp-2">
                        {entry.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {entry.ataChapter} · {entry.category}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-alert-orange-500/20 text-alert-orange-300 border border-alert-orange-500/30 flex-shrink-0">
                      {entry.successRate}%
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Quote className="w-3 h-3" />
                      引用 {entry.referenceCount} 次
                    </span>
                    <span className="text-tech-cyan-400">更新 {entry.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-deep-blue-800/40 backdrop-blur p-1.5 rounded-2xl border border-white/5 w-fit animate-fade-in-up stagger-5">
          <button onClick={() => setTab('quality_list')} className={tabCls(tab === 'quality_list')}>
            <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            质量清单
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              tab === 'quality_list' ? 'bg-tech-cyan-500/20' : 'bg-white/5'
            }`}>{qualitySummaries.length}</span>
          </button>
          <button onClick={() => setTab('fault_aggregate')} className={tabCls(tab === 'fault_aggregate')}>
            <Flame className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            按故障聚合
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              tab === 'fault_aggregate' ? 'bg-tech-cyan-500/20' : 'bg-white/5'
            }`}>{aggregatedFaults.length}</span>
          </button>
        </div>

        {tab === 'quality_list' && (
          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-4 h-4 text-alert-orange-400" />
              <h3 className="text-white font-semibold">案例质量检查清单（按案例汇总）</h3>
              <span className="ml-auto text-xs text-slate-400">
                共 {qualitySummaries.length} 条案例 · 缺失
                <strong className="text-alert-orange-400 font-mono ml-1">{totalIssues}</strong>
                项
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-4 ml-7">
              一行展示同一条案例的所有缺失项，缺手册依据/放行结论/后续跟踪独立显示 ✅ / ❌ · 点击故障代码可查看详情 · 高频引用且缺失严重可一键加入复盘
            </p>
          {addMsg && (
            <div className="mb-4 ml-7 px-3 py-2 rounded-lg text-xs bg-tech-cyan-500/10 text-tech-cyan-400 border border-tech-cyan-500/20 inline-block">
              {addMsg}
              {!addMsg.includes('已在') && (
                <button
                  onClick={() => navigate('/review-checklist')}
                  className="ml-2 underline hover:text-tech-cyan-300"
                >
                  去复盘清单查看 →
                </button>
              )}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">缺失数</th>
                  <th className="pb-3 font-medium">案例标题</th>
                  <th className="pb-3 font-medium">故障代码</th>
                  <th className="pb-3 font-medium text-right">引用数</th>
                  <th className="pb-3 font-medium text-center">手册依据</th>
                  <th className="pb-3 font-medium text-center">放行结论</th>
                  <th className="pb-3 font-medium text-center">后续跟踪</th>
                  <th className="pb-3 font-medium">更新日期</th>
                  <th className="pb-3 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {qualitySummaries.map((q) => (
                  <tr
                    key={q.entryId}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                      q.missingCount >= 3 ? 'bg-alert-orange-500/[0.03]' : ''
                    }`}
                  >
                    <td className="py-3">
                      {q.missingCount > 0 ? (
                        <span className={`inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono border ${
                          q.missingCount >= 3
                            ? 'bg-alert-orange-500/20 text-alert-orange-400 border-alert-orange-500/30'
                            : q.missingCount >= 2
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                        }`}>
                          {q.missingCount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25">
                          PASS
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-slate-100 line-clamp-1 max-w-xs">{q.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{q.category}</div>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => setFaultDetailModal(q.faultCode)}
                        className="font-mono text-tech-cyan-400 text-xs hover:text-tech-cyan-300 hover:underline cursor-pointer transition-colors"
                      >
                        {q.faultCode}
                      </button>
                    </td>
                    <td className="py-3 text-right font-mono text-white">{q.referenceCount}</td>
                    <td className="py-3 text-center">
                      {q.hasManualReference ? (
                        <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>齐备</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-alert-orange-400">
                          <XCircle className="w-4 h-4" />
                          <span>缺失</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {q.hasReleaseConclusion ? (
                        <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>齐备</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-alert-orange-400">
                          <XCircle className="w-4 h-4" />
                          <span>缺失</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {q.hasFollowUp ? (
                        <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>齐备</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-alert-orange-400">
                          <XCircle className="w-4 h-4" />
                          <span>缺失</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-slate-400">{q.lastUpdated}</td>
                    <td className="py-3 text-center">
                      {q.missingCount > 0 ? (
                        addedEntryIds.has(q.entryId) ? (
                          <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已加入
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToReview(q)}
                            disabled={addingId === q.entryId}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                              q.missingCount >= 2 && q.referenceCount >= 20
                                ? 'bg-gradient-to-r from-alert-orange-500 to-alert-orange-600 text-white shadow-lg shadow-alert-orange-500/15 hover:from-alert-orange-400 hover:to-alert-orange-500'
                                : 'bg-deep-blue-700/60 text-slate-300 hover:bg-deep-blue-700 border border-white/10'
                            }`}
                          >
                            {addingId === q.entryId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Rocket className="w-3.5 h-3.5" />
                            )}
                            加入复盘
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {tab === 'fault_aggregate' && (
          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-4 h-4 text-alert-orange-400" />
              <h3 className="text-white font-semibold">按故障代码聚合</h3>
              <span className="ml-auto text-xs text-slate-400">
                共 {aggregatedFaults.length} 个故障代码
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-4 ml-7">
              按故障代码聚合统计相关案例、低成功率、质量缺失问题 · 点击行可查看详情 · 无复盘任务可一键加入
            </p>
            {addMsg && (
              <div className="mb-4 ml-7 px-3 py-2 rounded-lg text-xs bg-tech-cyan-500/10 text-tech-cyan-400 border border-tech-cyan-500/20 inline-block">
                {addMsg}
                {!addMsg.includes('已在') && (
                  <button
                    onClick={() => navigate('/review-checklist')}
                    className="ml-2 underline hover:text-tech-cyan-300"
                  >
                    去复盘清单查看 →
                  </button>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                    <th className="pb-3 font-medium">故障代码</th>
                    <th className="pb-3 font-medium">故障描述</th>
                    <th className="pb-3 font-medium">ATA</th>
                    <th className="pb-3 font-medium text-center">相关案例</th>
                    <th className="pb-3 font-medium text-center">低成功率</th>
                    <th className="pb-3 font-medium text-center">质量缺失</th>
                    <th className="pb-3 font-medium text-center">复盘状态</th>
                    <th className="pb-3 font-medium text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedFaults.map((af) => (
                    <tr
                      key={af.faultCode}
                      onClick={() => setFaultDetailModal(af.faultCode)}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        af.qualityIssueCount >= 2 ? 'bg-alert-orange-500/[0.03]' : ''
                      }`}
                    >
                      <td className="py-3">
                        <span className="font-mono text-tech-cyan-400 text-xs">{af.faultCode}</span>
                      </td>
                      <td className="py-3">
                        <div className="font-medium text-slate-100 line-clamp-1 max-w-xs">{af.faultDescription}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-deep-blue-600/80 text-slate-300 font-mono">
                          {af.ataChapter}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-mono text-white font-semibold">{af.relatedCases}</span>
                      </td>
                      <td className="py-3 text-center">
                        {af.lowSuccessCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono bg-alert-orange-500/20 text-alert-orange-400 border border-alert-orange-500/30">
                            {af.lowSuccessCount}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {af.qualityIssueCount > 0 ? (
                          <span className={`inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono border ${
                            af.qualityIssueCount >= 2
                              ? 'bg-alert-orange-500/20 text-alert-orange-400 border-alert-orange-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            {af.qualityIssueCount}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25">
                            PASS
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {af.reviewTask ? (
                          <div className="flex flex-col items-center gap-1">
                            {sourceLabel(af.reviewTask.source)}
                            {statusBadge(af.reviewTask.status)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">无</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {af.reviewTask ? (
                          <span className="inline-flex items-center gap-1 text-xs text-tech-cyan-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已存在
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddFaultToReview(af.faultCode);
                            }}
                            disabled={addingFaultCode === af.faultCode}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-deep-blue-700/60 text-slate-300 hover:bg-deep-blue-700 border border-white/10 transition-all disabled:opacity-50"
                          >
                            {addingFaultCode === af.faultCode ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Rocket className="w-3.5 h-3.5" />
                            )}
                            加入复盘
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-tech-cyan-400" />
            <h3 className="text-white font-semibold">高引用知识条目 TOP</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {entries
              .slice()
              .sort((a, b) => b.referenceCount - a.referenceCount)
              .slice(0, 6)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5 hover:border-tech-cyan-500/20 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-deep-blue-600/80 text-slate-300 font-mono">
                          {entry.ataChapter}
                        </span>
                        <span className="text-[10px] text-slate-500">{entry.category}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-white transition-colors">
                        {entry.title}
                      </h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold font-mono text-tech-cyan-400">
                        {entry.referenceCount}
                      </div>
                      <div className="text-[10px] text-slate-500">引用</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      成功率{' '}
                      <span
                        className={`font-mono font-semibold ${
                          entry.successRate >= 80
                            ? 'text-tech-cyan-400'
                            : entry.successRate >= 60
                            ? 'text-yellow-400'
                            : 'text-alert-orange-400'
                        }`}
                      >
                        {entry.successRate}%
                      </span>
                    </span>
                    <span className="text-slate-500">{entry.lastUpdated}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {faultDetailModal && (() => {
        const detail = getFaultDetail(faultDetailModal);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in-up">
            <div className="bg-deep-blue-800 border border-white/10 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-start justify-between p-6 border-b border-white/5 bg-gradient-to-r from-deep-blue-800 to-deep-blue-700/50">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-lg text-tech-cyan-400 bg-tech-cyan-500/10 px-3 py-1 rounded-lg border border-tech-cyan-500/20">
                      {detail.faultCode}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-deep-blue-600/60 text-xs text-slate-300 font-mono">
                      {detail.ataChapter}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{detail.faultDescription}</h2>
                </div>
                <button
                  onClick={() => setFaultDetailModal(null)}
                  className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <BookOpen className="w-4 h-4 text-tech-cyan-400" />
                      相关案例
                    </div>
                    <div className="text-2xl font-bold font-mono text-white">{detail.relatedCases.length}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Flame className="w-4 h-4 text-alert-orange-400" />
                      低成功率
                    </div>
                    <div className="text-2xl font-bold font-mono text-alert-orange-400">{detail.lowSuccessCases.length}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Shield className="w-4 h-4 text-yellow-400" />
                      质量缺失
                    </div>
                    <div className="text-2xl font-bold font-mono text-yellow-400">{detail.qualityIssueCases.length}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <Rocket className="w-4 h-4 text-purple-400" />
                      复盘状态
                    </div>
                    <div className="text-sm">
                      {detail.reviewTask ? (
                        <div className="flex flex-col gap-1">
                          {sourceLabel(detail.reviewTask.source)}
                          {statusBadge(detail.reviewTask.status)}
                        </div>
                      ) : (
                        <span className="text-slate-500">未加入</span>
                      )}
                    </div>
                  </div>
                </div>

                {detail.reviewTask && (
                  <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-purple-400" />
                      已有复盘任务
                    </h4>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono text-tech-cyan-400 text-sm bg-tech-cyan-500/10 px-2.5 py-1 rounded-lg border border-tech-cyan-500/20">
                        {detail.reviewTask.id}
                      </span>
                      {sourceLabel(detail.reviewTask.source)}
                      {statusBadge(detail.reviewTask.status)}
                      {detail.reviewTask.assignee && (
                        <span className="text-xs text-slate-300">
                          责任人：{detail.reviewTask.assignee}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        截止：{detail.reviewTask.dueDate}
                      </span>
                    </div>
                    {detail.reviewTask.reviewReason && (
                      <p className="text-xs text-slate-400 mt-3">
                        <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-alert-orange-400" />
                        {detail.reviewTask.reviewReason}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-tech-cyan-400" />
                    相关案例列表（{detail.relatedCases.length}）
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.relatedCases.map((entry) => (
                      <div key={entry.id} className="p-3 rounded-xl bg-deep-blue-800/50 border border-white/5 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-100 font-medium truncate">{entry.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {entry.category} · 更新 {entry.lastUpdated}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-slate-400">引用 {entry.referenceCount} 次</div>
                          <div className={`text-sm font-mono font-semibold mt-0.5 ${
                            entry.successRate >= 80
                              ? 'text-tech-cyan-400'
                              : entry.successRate >= 60
                              ? 'text-yellow-400'
                              : 'text-alert-orange-400'
                          }`}>
                            {entry.successRate}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.lowSuccessCases.length > 0 && (
                  <div className="p-5 rounded-2xl bg-alert-orange-500/[0.03] border border-alert-orange-500/20">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-alert-orange-400" />
                      低成功率案例（{detail.lowSuccessCases.length}）
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detail.lowSuccessCases.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-xl bg-alert-orange-500/10 border border-alert-orange-500/20 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-100 font-medium truncate">{entry.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {entry.category} · 引用 {entry.referenceCount} 次
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-alert-orange-500/20 text-alert-orange-300 border border-alert-orange-500/30 flex-shrink-0">
                            {entry.successRate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.qualityIssueCases.length > 0 && (
                  <div className="p-5 rounded-2xl bg-yellow-500/[0.03] border border-yellow-500/20">
                    <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yellow-400" />
                      质量缺失案例（{detail.qualityIssueCases.length}）
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {detail.qualityIssueCases.map((q) => (
                        <div key={q.entryId} className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-100 font-medium truncate">{q.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>手册依据：{q.hasManualReference ? '✓' : '✗'}</span>
                              <span>放行结论：{q.hasReleaseConclusion ? '✓' : '✗'}</span>
                              <span>后续跟踪：{q.hasFollowUp ? '✓' : '✗'}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full text-xs font-bold font-mono border flex-shrink-0 ${
                            q.missingCount >= 2
                              ? 'bg-alert-orange-500/20 text-alert-orange-400 border-alert-orange-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          }`}>
                            缺{q.missingCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-deep-blue-800/50 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {detail.reviewTask ? (
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-tech-cyan-400" />
                      该故障已存在复盘任务
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-alert-orange-400" />
                      该故障暂无复盘任务，建议加入复盘
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFaultDetailModal(null)}
                    className="px-4 py-2 rounded-xl text-sm bg-deep-blue-700/60 text-slate-300 hover:bg-deep-blue-700 border border-white/10 transition-colors"
                  >
                    关闭
                  </button>
                  {!detail.reviewTask && (
                    <button
                      onClick={() => handleAddFaultToReview(faultDetailModal)}
                      disabled={addingFaultCode === faultDetailModal}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-tech-cyan-500 to-tech-cyan-600 text-white shadow-lg shadow-tech-cyan-500/20 hover:shadow-tech-cyan-500/30 hover:from-tech-cyan-400 hover:to-tech-cyan-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {addingFaultCode === faultDetailModal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Rocket className="w-4 h-4" />
                      )}
                      加入复盘
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
}
