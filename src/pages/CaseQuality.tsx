import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import {
  BookOpen,
  AlertCircle,
  FileText,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  BookMarked,
  Send,
  History,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import type { KnowledgeEntry, QualityIssue } from '../../shared/types';

export default function CaseQuality() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [lowSuccess, setLowSuccess] = useState<KnowledgeEntry[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'missing_manual' | 'missing_release' | 'missing_followup'>('all');

  useEffect(() => {
    Promise.all([
      api.getKnowledgeEntries(),
      api.getLowSuccessRateEntries(),
      api.getQualityIssues(),
    ]).then(([entriesData, lowSuccessData, issuesData]) => {
      setEntries(entriesData.sort((a, b) => b.referenceCount - a.referenceCount));
      setLowSuccess(lowSuccessData);
      setQualityIssues(issuesData);
    });
  }, []);

  const missingManual = qualityIssues.filter((i) => i.issueType === 'missing_manual');
  const missingRelease = qualityIssues.filter((i) => i.issueType === 'missing_release');
  const missingFollowup = qualityIssues.filter((i) => i.issueType === 'missing_followup');

  const filteredIssues =
    activeTab === 'all' ? qualityIssues : qualityIssues.filter((i) => i.issueType === activeTab);

  const referenceChartData = entries.slice(0, 8).map((e) => ({
    name: e.faultCode,
    引用次数: e.referenceCount,
    成功率: e.successRate,
  }));

  const qualityTrendData = [
    { month: '1月', 合格率: 78.5 },
    { month: '2月', 合格率: 81.2 },
    { month: '3月', 合格率: 79.8 },
    { month: '4月', 合格率: 83.4 },
    { month: '5月', 合格率: 85.1 },
    { month: '6月', 合格率: 86.7 },
  ];

  const issueTabs = [
    { key: 'all', label: '全部问题', count: qualityIssues.length, icon: AlertCircle, color: 'text-slate-300' },
    { key: 'missing_manual', label: '缺少手册依据', count: missingManual.length, icon: BookMarked, color: 'text-alert-orange-400' },
    { key: 'missing_release', label: '缺少放行结论', count: missingRelease.length, icon: Send, color: 'text-yellow-400' },
    { key: 'missing_followup', label: '缺少后续跟踪', count: missingFollowup.length, icon: History, color: 'text-blue-400' },
  ];

  return (
    <Layout title="案例质量" subtitle="知识条目有效性与案例完整度检查">
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="知识条目总数"
            value={entries.length}
            unit="条"
            icon={<BookOpen className="w-4 h-4" />}
            trend={5.8}
            trendLabel="本月新增"
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-1"
          />
          <StatCard
            title="频繁引用低成功率"
            value={lowSuccess.length}
            unit="条"
            icon={<ShieldAlert className="w-4 h-4" />}
            gradient="from-alert-orange-500/25 to-alert-orange-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="有手册依据"
            value={entries.filter((e) => e.hasManualReference).length}
            unit="条"
            icon={<FileText className="w-4 h-4" />}
            trend={3.2}
            trendLabel="较上周"
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="案例完整率"
            value="86.7"
            unit="%"
            icon={<CheckCircle2 className="w-4 h-4" />}
            trend={2.1}
            trendLabel="较上月"
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-4"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-tech-cyan-400" />
                <h3 className="text-white font-semibold">知识条目引用排行</h3>
              </div>
              <span className="text-xs text-slate-400">Top 8 · 引用次数 vs 成功率</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referenceChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar yAxisId="left" dataKey="引用次数" fill="#00D4AA" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Bar yAxisId="right" dataKey="成功率" fill="#FF6B35" radius={[4, 4, 0, 0]} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-tech-cyan-400" />
              <h3 className="text-white font-semibold">案例质量合格率趋势</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={[70, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, '合格率']}
                  />
                  <Line
                    type="monotone"
                    dataKey="合格率"
                    stroke="#00D4AA"
                    strokeWidth={2.5}
                    dot={{ fill: '#00D4AA', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-alert-orange-400" />
            <h3 className="text-white font-semibold">频繁引用但低成功率条目</h3>
            <span className="text-xs text-slate-400 ml-2">（引用≥20次且成功率＜65%）</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lowSuccess.slice(0, 6).map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl border-2 border-alert-orange-500/30 bg-alert-orange-500/5 hover:bg-alert-orange-500/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs text-alert-orange-400 bg-alert-orange-500/15 px-2 py-0.5 rounded">
                      {entry.faultCode}
                    </span>
                    <h4 className="text-white text-sm font-medium mt-2 line-clamp-1">{entry.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-alert-orange-400 font-bold font-mono text-xl">
                      {entry.successRate}%
                    </div>
                    <div className="text-[10px] text-slate-500">成功率</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-400">
                    引用 <span className="text-white font-mono font-semibold">{entry.referenceCount}</span> 次
                  </span>
                  <span className="text-[10px] text-slate-500">更新于 {entry.lastUpdated}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-5 animate-fade-in-up stagger-7">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-tech-cyan-400" />
              <h3 className="text-white font-semibold">案例质量问题清单</h3>
            </div>
            <div className="flex gap-1.5">
              {issueTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-tech-cyan-500/20 text-tech-cyan-400 border border-tech-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeTab === tab.key ? 'bg-tech-cyan-500/30 text-tech-cyan-300' : 'bg-slate-600/40 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">问题类型</th>
                  <th className="pb-3 font-medium">案例标题</th>
                  <th className="pb-3 font-medium">故障代码</th>
                  <th className="pb-3 font-medium">手册依据</th>
                  <th className="pb-3 font-medium">放行结论</th>
                  <th className="pb-3 font-medium">后续跟踪</th>
                  <th className="pb-3 font-medium">报告日期</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.slice(0, 10).map((issue) => (
                  <tr key={issue.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          issue.issueType === 'missing_manual'
                            ? 'bg-alert-orange-500/15 text-alert-orange-400'
                            : issue.issueType === 'missing_release'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        {issue.issueType === 'missing_manual' && '缺手册依据'}
                        {issue.issueType === 'missing_release' && '缺放行结论'}
                        {issue.issueType === 'missing_followup' && '缺后续跟踪'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-200 max-w-[300px] truncate">{issue.caseTitle}</td>
                    <td className="py-3 font-mono text-tech-cyan-400">{issue.faultCode}</td>
                    <td className="py-3">
                      {issue.issueType !== 'missing_manual' ? (
                        <CheckCircle2 className="w-4 h-4 text-tech-cyan-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-alert-orange-400" />
                      )}
                    </td>
                    <td className="py-3">
                      {issue.issueType !== 'missing_release' ? (
                        <CheckCircle2 className="w-4 h-4 text-tech-cyan-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-alert-orange-400" />
                      )}
                    </td>
                    <td className="py-3">
                      {issue.issueType !== 'missing_followup' ? (
                        <CheckCircle2 className="w-4 h-4 text-tech-cyan-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-alert-orange-400" />
                      )}
                    </td>
                    <td className="py-3 text-slate-400 text-xs">{issue.reportedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
