import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  FileText,
  Lightbulb,
  Mail,
  XCircle,
  RefreshCw,
  Plus,
  ListChecks,
  Filter,
  Flame,
  Timer,
  Sparkles,
  Archive,
  GripVertical,
  Target,
  Shield,
} from 'lucide-react';
import type { ReviewTask, CandidateReviewTask } from '../../shared/types';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';
type TabView = 'active' | 'candidates' | 'closed';

export default function ReviewChecklist() {
  const { filters } = useAppStore();
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [candidates, setCandidates] = useState<CandidateReviewTask[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tab, setTab] = useState<TabView>('active');

  const [repeatThreshold, setRepeatThreshold] = useState(8);
  const [timeoutThreshold, setTimeoutThreshold] = useState(5);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const baseParams = {
    aircraftType: filters.aircraftType,
    base: filters.base,
    ataChapter: filters.ataChapter,
    season: filters.season,
    faultCode: filters.faultCode,
    dateStart: filters.dateRange.start,
    dateEnd: filters.dateRange.end,
  };

  const engineers = useMemo(
    () => [
      { value: 'wang_ming', label: '王明（机电）' },
      { value: 'li_wei', label: '李伟（结构）' },
      { value: 'zhang_hao', label: '张浩（电子）' },
      { value: 'chen_jun', label: '陈军（动力）' },
      { value: 'liu_qiang', label: '刘强（系统）' },
      { value: 'zhou_le', label: '周乐（机上娱乐）' },
    ],
    []
  );

  function loadTasks() {
    api.getReviewTasks().then(setTasks);
  }

  function refreshCandidates() {
    setLoadingCandidates(true);
    api
      .getCandidateTasks(baseParams, repeatThreshold, timeoutThreshold)
      .then((data) => {
        setCandidates(data);
        setSelectedCandidates(new Set());
      })
      .finally(() => setLoadingCandidates(false));
  }

  useEffect(() => {
    loadTasks();
    refreshCandidates();
  }, []);

  useEffect(() => {
    if (tab === 'candidates') {
      refreshCandidates();
    }
  }, [tab, repeatThreshold, timeoutThreshold]);

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id);
  }

  async function handleAssign(id: string, assignee: string, dueDate: string) {
    await api.assignTask(id, assignee, dueDate);
    loadTasks();
  }

  async function handleUpdate(id: string, updates: Partial<ReviewTask>) {
    await api.updateTask(id, updates);
    loadTasks();
  }

  async function handleAddCandidates() {
    if (selectedCandidates.size === 0) return;
    const toAdd = candidates.filter((c) => selectedCandidates.has(c.candidateId));
    await api.addCandidates(toAdd);
    setSelectedCandidates(new Set());
    loadTasks();
    refreshCandidates();
    setTab('active');
  }

  function toggleCandidate(id: string) {
    const s = new Set(selectedCandidates);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedCandidates(s);
  }

  function toggleAllCandidates() {
    if (selectedCandidates.size === candidates.length && candidates.length > 0) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(candidates.map((c) => c.candidateId)));
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: completedTasks.length,
    overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length,
  };

  const filteredActive = activeTasks.filter(
    (t) => statusFilter === 'all' || t.status === statusFilter
  );

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

  function engineerName(k: string) {
    return engineers.find((e) => e.value === k)?.label || k;
  }

  const tabCls = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25 shadow-lg shadow-tech-cyan-500/5'
        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <Layout title="复盘清单" subtitle="高频重复故障与超时排故复盘任务管理">
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-5">
          <StatCard
            title="复盘任务总数"
            value={stats.total}
            unit="条"
            icon={<ClipboardList className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-1"
          />
          <StatCard
            title="待处理"
            value={stats.pending}
            unit="条"
            icon={<Clock className="w-4 h-4" />}
            gradient="from-slate-500/20 to-slate-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="进行中"
            value={stats.inProgress}
            unit="条"
            icon={<Target className="w-4 h-4" />}
            gradient="from-blue-500/20 to-blue-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="已闭环"
            value={stats.completed}
            unit="条"
            icon={<Shield className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-4"
          />
          <StatCard
            title="即将逾期"
            value={stats.overdue}
            unit="条"
            icon={<AlertCircle className="w-4 h-4" />}
            gradient="from-alert-orange-500/20 to-alert-orange-500/0"
            delay="stagger-5"
          />
        </div>

        <div className="flex items-center gap-2 bg-deep-blue-800/40 backdrop-blur p-1.5 rounded-2xl border border-white/5 w-fit animate-fade-in-up stagger-2">
          <button onClick={() => setTab('active')} className={tabCls(tab === 'active')}>
            <ClipboardList className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            进行中清单
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              tab === 'active' ? 'bg-tech-cyan-500/20' : 'bg-white/5'
            }`}>{activeTasks.length}</span>
          </button>
          <button onClick={() => setTab('candidates')} className={tabCls(tab === 'candidates')}>
            <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            候选任务生成
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              tab === 'candidates' ? 'bg-tech-cyan-500/20' : 'bg-white/5'
            }`}>{candidates.length}</span>
          </button>
          <button onClick={() => setTab('closed')} className={tabCls(tab === 'closed')}>
            <Archive className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            闭环记录
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              tab === 'closed' ? 'bg-tech-cyan-500/20' : 'bg-white/5'
            }`}>{completedTasks.length}</span>
          </button>
        </div>

        {tab === 'candidates' && (
          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-6 animate-fade-in-up stagger-3">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-tech-cyan-400" />
                  智能候选任务生成
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  根据故障数据自动挖掘需要复盘的高频与超时案例，调整阈值后可勾选加入每周复盘清单
                </p>
              </div>
              <button
                onClick={refreshCandidates}
                disabled={loadingCandidates}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-deep-blue-700/60 hover:bg-deep-blue-700 border border-white/5 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCandidates ? 'animate-spin' : ''}`} />
                重新生成
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 p-5 rounded-2xl bg-deep-blue-700/30 border border-white/5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-alert-orange-400" />
                    重复故障阈值（次数）
                  </label>
                  <span className="text-2xl font-bold font-mono text-alert-orange-400">
                    ≥ {repeatThreshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={repeatThreshold}
                  onChange={(e) => setRepeatThreshold(Number(e.target.value))}
                  className="w-full accent-[#FF6B35] h-2"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>宽松（3次）</span>
                  <span>一般（11次）</span>
                  <span>严格（20次）</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-tech-cyan-400" />
                    超时排故阈值（小时）
                  </label>
                  <span className="text-2xl font-bold font-mono text-tech-cyan-400">
                    ≥ {timeoutThreshold}h
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={timeoutThreshold}
                  onChange={(e) => setTimeoutThreshold(Number(e.target.value))}
                  className="w-full accent-[#00D4AA] h-2"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>宽松（2h）</span>
                  <span>一般（8h）</span>
                  <span>严格（15h）</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-[#00D4AA]"
                    checked={candidates.length > 0 && selectedCandidates.size === candidates.length}
                    onChange={toggleAllCandidates}
                  />
                  全选
                </label>
                <span className="text-xs text-slate-500">
                  已选 <strong className="text-tech-cyan-400 font-mono">{selectedCandidates.size}</strong> / {candidates.length} 条
                </span>
              </div>
              <button
                onClick={handleAddCandidates}
                disabled={selectedCandidates.size === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-tech-cyan-500 to-tech-cyan-600 text-white shadow-lg shadow-tech-cyan-500/20 hover:shadow-tech-cyan-500/30 hover:from-tech-cyan-400 hover:to-tech-cyan-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Plus className="w-4 h-4" />
                加入每周复盘清单（{selectedCandidates.size}）
              </button>
            </div>

            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <div className="max-h-[480px] overflow-y-auto">
                {loadingCandidates ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 animate-pulse">
                    正在分析故障数据生成候选任务...
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-tech-cyan-400/50 mb-3" />
                    <p>当前阈值下无符合条件的候选任务</p>
                    <p className="text-xs text-slate-500 mt-1">试着降低重复次数阈值或超时阈值</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-deep-blue-800/95 backdrop-blur z-10">
                      <tr className="text-left text-slate-400 text-xs border-b border-white/5">
                        <th className="p-4 font-medium w-12"></th>
                        <th className="p-4 font-medium">类型</th>
                        <th className="p-4 font-medium">故障代码</th>
                        <th className="p-4 font-medium">故障描述</th>
                        <th className="p-4 font-medium text-right">重复次数</th>
                        <th className="p-4 font-medium text-right">平均停场</th>
                        <th className="p-4 font-medium">筛选原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c) => (
                        <tr
                          key={c.candidateId}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${
                            selectedCandidates.has(c.candidateId)
                              ? 'bg-tech-cyan-500/[0.06]'
                              : 'hover:bg-white/[0.02]'
                          }`}
                          onClick={() => toggleCandidate(c.candidateId)}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-[#00D4AA]"
                              checked={selectedCandidates.has(c.candidateId)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleCandidate(c.candidateId);
                              }}
                            />
                          </td>
                          <td className="p-4">
                            {c.type === 'repeat' ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-alert-orange-500/15 text-alert-orange-400 border border-alert-orange-500/25">
                                <Flame className="w-3 h-3" /> 高频重复
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-tech-cyan-500/15 text-tech-cyan-400 border border-tech-cyan-500/25">
                                <Timer className="w-3 h-3" /> 超时排故
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-tech-cyan-400 font-medium">{c.faultCode}</td>
                          <td className="p-4 text-slate-200">{c.faultDescription}</td>
                          <td className="p-4 text-right font-mono text-white font-semibold">{c.occurrenceCount}</td>
                          <td className="p-4 text-right font-mono text-slate-300">{c.avgDowntime}h</td>
                          <td className="p-4 text-xs text-slate-400 max-w-xs">{c.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'active' && (
          <>
            <div className="flex items-center gap-2 animate-fade-in-up stagger-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 mr-2">状态筛选</span>
              {(['all', 'pending', 'in_progress'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                    statusFilter === s
                      ? 'bg-tech-cyan-500/15 text-tech-cyan-400 border-tech-cyan-500/25'
                      : 'bg-deep-blue-700/40 text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  {s === 'all' ? '全部' : s === 'pending' ? '待处理' : '进行中'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredActive.length === 0 ? (
                <div className="py-16 text-center text-slate-500 animate-fade-in-up stagger-4">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无任务，去候选任务区生成一些吧</p>
                </div>
              ) : (
                filteredActive.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl overflow-hidden animate-fade-in-up ${
                      `stagger-${Math.min(idx + 3, 8)}`
                    }`}
                  >
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => toggleExpand(task.id)}
                    >
                      <GripVertical className="w-5 h-5 text-slate-600 flex-shrink-0" />
                      {statusBadge(task.status)}
                      {task.type === 'repeat' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-alert-orange-500/10 text-alert-orange-300 border border-alert-orange-500/20">
                          <Flame className="w-3 h-3" /> 高频
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-tech-cyan-500/10 text-tech-cyan-300 border border-tech-cyan-500/20">
                          <Timer className="w-3 h-3" /> 超时
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-100 font-semibold flex items-center gap-2">
                          <span className="font-mono text-tech-cyan-400 text-sm">{task.faultCode}</span>
                          <span className="truncate">{task.title}</span>
                        </h4>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-alert-orange-400" />
                            {task.occurrenceCount} 次故障 · 平均 {task.avgDowntime}h 停场
                          </span>
                          <span className="flex items-center gap-1">
                            <ListChecks className="w-3 h-3 text-slate-500" />
                            {task.ataChapter}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 text-xs">
                        {task.assignee ? (
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {engineerName(task.assignee)}
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            未分配
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {task.dueDate}
                        </span>
                        {expanded === task.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {expanded === task.id && (
                      <div className="px-5 pb-5 border-t border-white/5 pt-5 space-y-5">
                        {task.status === 'pending' && (
                          <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                            <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <User className="w-4 h-4 text-tech-cyan-400" />
                              分配责任工程师
                            </h5>
                            <div className="flex flex-wrap gap-3 items-center">
                              <select
                                className="bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50 min-w-[180px]"
                                defaultValue=""
                                id={`eng-${task.id}`}
                              >
                                <option value="" disabled>
                                  选择工程师
                                </option>
                                {engineers.map((e) => (
                                  <option key={e.value} value={e.value}>
                                    {e.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="date"
                                className="bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50"
                                defaultValue={task.dueDate}
                                id={`due-${task.id}`}
                              />
                              <button
                                onClick={() => {
                                  const eng = (document.getElementById(`eng-${task.id}`) as HTMLSelectElement).value;
                                  const due = (document.getElementById(`due-${task.id}`) as HTMLInputElement).value;
                                  if (eng && due) handleAssign(task.id, eng, due);
                                }}
                                className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-tech-cyan-500 to-tech-cyan-600 text-white hover:from-tech-cyan-400 hover:to-tech-cyan-500 transition-all shadow-lg shadow-tech-cyan-500/15"
                              >
                                分配并开始
                              </button>
                            </div>
                          </div>
                        )}

                        {task.status !== 'pending' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                              <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-tech-cyan-400" />
                                原因分析
                              </h5>
                              <textarea
                                rows={4}
                                className="w-full bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50 resize-none"
                                placeholder="详细分析故障根本原因..."
                                defaultValue={task.rootCause || ''}
                                id={`rc-${task.id}`}
                              />
                            </div>
                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                                  排故提示修订
                                </h5>
                                <textarea
                                  rows={2}
                                  className="w-full bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50 resize-none"
                                  placeholder="需要修订或新增的排故提示内容..."
                                  defaultValue={task.tipRevision || ''}
                                  id={`tr-${task.id}`}
                                />
                              </div>
                              <div className="p-4 rounded-2xl bg-deep-blue-700/30 border border-white/5">
                                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-blue-400" />
                                  培训提醒
                                </h5>
                                <div className="space-y-2">
                                  <textarea
                                    rows={2}
                                    className="w-full bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50 resize-none"
                                    placeholder="培训对象、重点和形式..."
                                    defaultValue={task.trainingReminder?.content || ''}
                                    id={`tm-${task.id}`}
                                  />
                                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      defaultChecked={task.trainingReminder?.sent || false}
                                      className="accent-[#00D4AA]"
                                      id={`tms-${task.id}`}
                                    />
                                    标记为已发送培训通知
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {task.status !== 'pending' && (
                          <div className="flex items-center justify-between pt-2">
                            <select
                              className="bg-deep-blue-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-tech-cyan-500/50"
                              defaultValue={task.status}
                              id={`st-${task.id}`}
                            >
                              <option value="in_progress">进行中</option>
                              <option value="completed">已完成</option>
                            </select>
                            <button
                              onClick={() => {
                                const rc = (document.getElementById(`rc-${task.id}`) as HTMLTextAreaElement).value;
                                const tr = (document.getElementById(`tr-${task.id}`) as HTMLTextAreaElement).value;
                                const tm = (document.getElementById(`tm-${task.id}`) as HTMLTextAreaElement).value;
                                const tms = (document.getElementById(`tms-${task.id}`) as HTMLInputElement).checked;
                                const st = (document.getElementById(`st-${task.id}`) as HTMLSelectElement).value as ReviewTask['status'];
                                handleUpdate(task.id, {
                                  rootCause: rc,
                                  tipRevision: tr,
                                  trainingReminder: { content: tm, sent: tms },
                                  status: st,
                                });
                                setExpanded(null);
                              }}
                              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-tech-cyan-500 to-tech-cyan-600 text-white hover:from-tech-cyan-400 hover:to-tech-cyan-500 transition-all shadow-lg shadow-tech-cyan-500/15"
                            >
                              保存并更新
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === 'closed' && (
          <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-6 animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-tech-cyan-400" />
                  复盘闭环记录
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  所有已完成的复盘任务，包含责任人、原因分析、提示修订、培训和完成时间
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-mono bg-tech-cyan-500/10 text-tech-cyan-400 border border-tech-cyan-500/20">
                已闭环 {completedTasks.length} 条
              </span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无闭环记录，处理完任务后会出现在这里</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl border border-green-500/10 bg-green-500/[0.02] hover:bg-green-500/[0.04] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-tech-cyan-500/15 border border-tech-cyan-500/25 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-tech-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                            <CheckCircle2 className="w-3 h-3" /> 已闭环
                          </span>
                          <span className="font-mono text-tech-cyan-400 text-sm font-medium">
                            {task.faultCode}
                          </span>
                          <h4 className="text-slate-100 font-semibold truncate">{task.title}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 mb-4">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-tech-cyan-400" />
                            <span className="text-slate-300 font-medium">{engineerName(task.assignee || '-')}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-tech-cyan-400" />
                            完成于{' '}
                            <span className="text-tech-cyan-400 font-mono font-semibold">
                              {task.completedAt}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-alert-orange-400" />
                            处理 {task.occurrenceCount} 次故障 · 平均 {task.avgDowntime}h
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3.5 rounded-xl bg-deep-blue-700/40 border border-white/5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2 font-medium">
                              <FileText className="w-3 h-3 text-tech-cyan-400" />
                              原因分析
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                              {task.rootCause || <span className="text-slate-500">未填写</span>}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-deep-blue-700/40 border border-white/5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2 font-medium">
                              <Lightbulb className="w-3 h-3 text-yellow-400" />
                              提示修订
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                              {task.tipRevision || <span className="text-slate-500">未填写</span>}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-deep-blue-700/40 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                                <Mail className="w-3 h-3 text-blue-400" />
                                培训提醒
                              </div>
                              {task.trainingReminder?.sent ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> 已通知
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                  <XCircle className="w-2.5 h-2.5" /> 未通知
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed line-clamp-3">
                              {task.trainingReminder?.content || (
                                <span className="text-slate-500">未填写</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
