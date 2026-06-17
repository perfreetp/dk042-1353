import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import type { ReviewTask, OptionItem } from '../../shared/types';
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Loader,
  UserPlus,
  Send,
  BookOpen,
  Calendar,
  Save,
} from 'lucide-react';

type TaskStatus = 'all' | 'pending' | 'in_progress' | 'completed';
type TaskType = 'all' | 'repeat_fault' | 'timeout_troubleshoot';

export default function ReviewChecklist() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [engineers, setEngineers] = useState<OptionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  useEffect(() => {
    Promise.all([api.getReviewTasks(), api.getEngineers()]).then(([tasksData, engData]) => {
      setTasks(tasksData);
      setEngineers(engData);
    });
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const repeatCount = tasks.filter((t) => t.type === 'repeat_fault').length;
  const timeoutCount = tasks.filter((t) => t.type === 'timeout_troubleshoot').length;

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
    if (!editForm[id]) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        setEditForm((prev) => ({
          ...prev,
          [id]: {
            assignee: task.assignee || '',
            dueDate: task.dueDate || '',
            rootCauseAnalysis: task.rootCauseAnalysis || '',
            troubleshootingTipRevision: task.troubleshootingTipRevision || '',
            trainingReminder: task.trainingReminder || false,
          },
        }));
      }
    }
  }

  function handleAssign(id: string) {
    const form = editForm[id];
    if (!form?.assignee || !form?.dueDate) return;
    api.assignTask(id, form.assignee, form.dueDate).then((updated) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    });
  }

  function handleSave(id: string) {
    const form = editForm[id];
    if (!form) return;
    const updates: any = {};
    if (form.rootCauseAnalysis) updates.rootCauseAnalysis = form.rootCauseAnalysis;
    if (form.troubleshootingTipRevision) updates.troubleshootingTipRevision = form.troubleshootingTipRevision;
    updates.trainingReminder = form.trainingReminder || false;
    if (form.rootCauseAnalysis && form.troubleshootingTipRevision) {
      updates.status = 'completed';
    }
    api.updateTask(id, updates).then((updated) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    });
  }

  function updateFormField(taskId: string, field: string, value: any) {
    setEditForm((prev) => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [field]: value },
    }));
  }

  function getStatusBadge(status: string) {
    const config = {
      pending: { label: '待处理', icon: Circle, cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
      in_progress: { label: '处理中', icon: Loader, cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      completed: { label: '已完成', icon: CheckCircle, cls: 'bg-tech-cyan-500/20 text-tech-cyan-400 border-tech-cyan-500/30' },
    };
    const cfg = config[status as keyof typeof config] || config.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
        <Icon className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
        {cfg.label}
      </span>
    );
  }

  const inputClass =
    'w-full bg-deep-blue-700/60 border border-white/10 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-tech-cyan-500/40 focus:border-tech-cyan-500/40 placeholder-slate-500';

  return (
    <Layout title="复盘清单" subtitle="高频重复故障与超时排故记录跟踪处理">
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-5">
          <StatCard
            title="待处理任务"
            value={pendingCount}
            unit="项"
            icon={<Circle className="w-4 h-4" />}
            gradient="from-slate-500/20 to-slate-500/0"
            delay="stagger-1"
          />
          <StatCard
            title="处理中任务"
            value={inProgressCount}
            unit="项"
            icon={<Loader className="w-4 h-4" />}
            gradient="from-blue-500/20 to-blue-500/0"
            delay="stagger-2"
          />
          <StatCard
            title="已完成任务"
            value={completedCount}
            unit="项"
            icon={<CheckCircle className="w-4 h-4" />}
            gradient="from-tech-cyan-500/20 to-tech-cyan-500/0"
            delay="stagger-3"
          />
          <StatCard
            title="高频重复故障"
            value={repeatCount}
            unit="项"
            icon={<AlertTriangle className="w-4 h-4" />}
            gradient="from-alert-orange-500/25 to-alert-orange-500/0"
            delay="stagger-4"
          />
          <StatCard
            title="超时排故记录"
            value={timeoutCount}
            unit="项"
            icon={<Clock className="w-4 h-4" />}
            gradient="from-yellow-500/20 to-yellow-500/0"
            delay="stagger-5"
          />
        </div>

        <div className="bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl p-4 animate-fade-in-up stagger-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待处理' },
                { key: 'in_progress', label: '处理中' },
                { key: 'completed', label: '已完成' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as TaskStatus)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === tab.key
                      ? 'bg-tech-cyan-500/20 text-tech-cyan-400 border border-tech-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部类型' },
                { key: 'repeat_fault', label: '重复故障' },
                { key: 'timeout_troubleshoot', label: '超时排故' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key as TaskType)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === tab.key
                      ? 'bg-deep-blue-600/60 text-white border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTasks.map((task, idx) => {
            const isExpanded = expandedId === task.id;
            const form = editForm[task.id] || {};
            return (
              <div
                key={task.id}
                className={`bg-deep-blue-800/60 backdrop-blur border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up stagger-${Math.min((idx % 8) + 1, 8)}`}
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(task.id)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        task.type === 'repeat_fault'
                          ? 'bg-alert-orange-500/15 text-alert-orange-400'
                          : 'bg-yellow-500/15 text-yellow-400'
                      }`}
                    >
                      {task.type === 'repeat_fault' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-mono text-xs text-tech-cyan-400 bg-tech-cyan-500/10 px-2 py-0.5 rounded">
                          {task.faultCode}
                        </span>
                        <span className="text-xs text-slate-400">
                          {task.type === 'repeat_fault' ? '重复故障' : '超时排故'}
                        </span>
                        {getStatusBadge(task.status)}
                      </div>
                      <h3 className="text-white font-medium text-base mb-2">{task.faultDescription}</h3>
                      <div className="flex items-center gap-6 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="w-3.5 h-3.5" />
                          发生 <span className="text-white font-mono font-semibold">{task.occurrenceCount}</span> 次
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          平均停场 <span className="text-white font-mono font-semibold">{task.avgDowntimeHours}h</span>
                          {task.thresholdHours && (
                            <span className="text-alert-orange-400">(阈值 {task.thresholdHours}h)</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          {task.assignee || '未指派'}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            截止 {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-5">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {task.status === 'pending' && (
                          <div className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <UserPlus className="w-4 h-4 text-tech-cyan-400" />
                              任务分配
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1.5">责任工程师</label>
                                <select
                                  value={form.assignee || ''}
                                  onChange={(e) => updateFormField(task.id, 'assignee', e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="">请选择</option>
                                  {engineers.map((e) => (
                                    <option key={e.value} value={e.value}>
                                      {e.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1.5">截止日期</label>
                                <input
                                  type="date"
                                  value={form.dueDate || ''}
                                  onChange={(e) => updateFormField(task.id, 'dueDate', e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => handleAssign(task.id)}
                              disabled={!form.assignee || !form.dueDate}
                              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-tech-cyan-600 hover:bg-tech-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                              分配任务
                            </button>
                          </div>
                        )}

                        {(task.status === 'in_progress' || task.status === 'completed') && (
                          <>
                            <div className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-alert-orange-400" />
                                原因分析
                              </h4>
                              <textarea
                                value={form.rootCauseAnalysis || ''}
                                onChange={(e) => updateFormField(task.id, 'rootCauseAnalysis', e.target.value)}
                                rows={4}
                                placeholder="请录入故障根本原因分析..."
                                className={inputClass + ' resize-none'}
                              />
                            </div>

                            <div className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-tech-cyan-400" />
                                排故提示修订
                              </h4>
                              <textarea
                                value={form.troubleshootingTipRevision || ''}
                                onChange={(e) => updateFormField(task.id, 'troubleshootingTipRevision', e.target.value)}
                                rows={4}
                                placeholder="请输入修订后的排故操作提示..."
                                className={inputClass + ' resize-none'}
                              />
                            </div>

                            <div className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5 col-span-2">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={form.trainingReminder || false}
                                    onChange={(e) => updateFormField(task.id, 'trainingReminder', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-500 bg-deep-blue-700 text-tech-cyan-500 focus:ring-tech-cyan-500/40"
                                  />
                                  <span className="text-sm text-slate-200">发起培训提醒（通知相关工程师学习新排故提示）</span>
                                </label>
                                <button
                                  onClick={() => handleSave(task.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-tech-cyan-600 hover:bg-tech-cyan-500 transition-colors shadow-lg shadow-tech-cyan-600/20"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  保存并标记完成
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-deep-blue-700/40 border border-white/5">
                          <h4 className="text-sm font-semibold text-white mb-3">任务信息</h4>
                          <dl className="space-y-2.5 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-slate-400">任务编号</dt>
                              <dd className="text-white font-mono">{task.id}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-400">创建日期</dt>
                              <dd className="text-white">{task.createdAt}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-400">当前状态</dt>
                              <dd>{getStatusBadge(task.status)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-slate-400">责任人</dt>
                              <dd className="text-white">{task.assignee || '-'}</dd>
                            </div>
                          </dl>
                        </div>

                        {task.rootCauseAnalysis && (
                          <div className="p-4 rounded-xl bg-tech-cyan-500/5 border border-tech-cyan-500/20">
                            <h4 className="text-sm font-semibold text-tech-cyan-400 mb-2">已录入原因分析</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{task.rootCauseAnalysis}</p>
                          </div>
                        )}

                        {task.troubleshootingTipRevision && (
                          <div className="p-4 rounded-xl bg-tech-cyan-500/5 border border-tech-cyan-500/20">
                            <h4 className="text-sm font-semibold text-tech-cyan-400 mb-2">已修订排故提示</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{task.troubleshootingTipRevision}</p>
                          </div>
                        )}

                        {task.trainingReminder && (
                          <div className="p-4 rounded-xl bg-alert-orange-500/5 border border-alert-orange-500/20">
                            <h4 className="text-sm font-semibold text-alert-orange-400 flex items-center gap-1.5">
                              <Send className="w-4 h-4" />
                              培训提醒已发起
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">已通知相关责任工程师参加培训学习</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
