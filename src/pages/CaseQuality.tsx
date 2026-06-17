import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import type {
  KnowledgeEntry,
  CaseQualitySummary,
} from '../../shared/types';

type QualityTrendPoint = { month: string; passRate: number; issueCount: number };
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
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [qualitySummaries, setQualitySummaries] = useState<CaseQualitySummary[]>([]);
  const [lowSuccess, setLowSuccess] = useState<KnowledgeEntry[]>([]);

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
    ]).then(([e, q, l]) => {
      setEntries(e);
      setQualitySummaries(q);
      setLowSuccess(l);
    });
  }, []);

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

        <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-5">
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
            一行展示同一条案例的所有缺失项，缺手册依据/放行结论/后续跟踪独立显示 ✅ / ❌
          </p>
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
                    <td className="py-3 font-mono text-tech-cyan-400 text-xs">{q.faultCode}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
    </Layout>
  );
}
