import { mockFaultRecords, mockKnowledgeEntries, mockReviewTasks, optionData } from '../data/mockData.js';
import type {
  FaultRecord,
  KnowledgeEntry,
  ReviewTask,
  FilterState,
  FaultStatistics,
  HeatmapData,
  TopFault,
  RepeatAircraft,
  CommonAction,
  CaseQualitySummary,
  FaultDrillDownData,
  CandidateReviewTask,
} from '../../shared/types.js';

function filterRecords(records: FaultRecord[], filters: Partial<FilterState>): FaultRecord[] {
  return records.filter(r => {
    if (filters.aircraftType && r.aircraftType !== filters.aircraftType) return false;
    if (filters.base && r.base !== filters.base) return false;
    if (filters.ataChapter && r.ataChapter !== filters.ataChapter) return false;
    if (filters.season && r.season !== filters.season) return false;
    if (filters.faultCode && r.faultCode !== filters.faultCode) return false;
    if (filters.dateRange?.start && r.occurrenceDate < filters.dateRange.start) return false;
    if (filters.dateRange?.end && r.occurrenceDate > filters.dateRange.end) return false;
    return true;
  });
}

export function getFaults(filters: Partial<FilterState>): FaultRecord[] {
  return filterRecords(mockFaultRecords, filters);
}

export function getFaultStatistics(filters: Partial<FilterState>): FaultStatistics {
  const filtered = filterRecords(mockFaultRecords, filters);
  const totalFaults = filtered.length;
  const avgDowntime = totalFaults > 0 
    ? parseFloat((filtered.reduce((sum, r) => sum + r.downtimeHours, 0) / totalFaults).toFixed(1))
    : 0;

  const aircraftFaultMap = new Map<string, number>();
  filtered.forEach(r => {
    const key = `${r.aircraftReg}-${r.faultCode}`;
    aircraftFaultMap.set(key, (aircraftFaultMap.get(key) || 0) + 1);
  });
  const repeatAircraftCount = Array.from(aircraftFaultMap.values()).filter(v => v >= 3).length;

  const actionSet = new Set<string>();
  filtered.forEach(r => r.actions.forEach(a => actionSet.add(a)));
  const commonActionsCount = actionSet.size;

  const monthMap = new Map<string, number>();
  filtered.forEach(r => {
    const month = r.occurrenceDate.substring(0, 7);
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  });
  const faultTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
    .slice(-6);

  return { totalFaults, avgDowntime, repeatAircraftCount, commonActionsCount, faultTrend };
}

export function getHeatmapData(filters: Partial<FilterState>): HeatmapData[] {
  const filtered = filterRecords(mockFaultRecords, filters);
  const ataMap = new Map<string, { name: string; count: number; totalDowntime: number }>();

  filtered.forEach(r => {
    if (!ataMap.has(r.ataChapter)) {
      ataMap.set(r.ataChapter, { name: r.ataChapterName, count: 0, totalDowntime: 0 });
    }
    const entry = ataMap.get(r.ataChapter)!;
    entry.count++;
    entry.totalDowntime += r.downtimeHours;
  });

  return Array.from(ataMap.entries()).map(([ata, data]) => ({
    ataChapter: ata,
    ataChapterName: data.name,
    count: data.count,
    avgDowntime: parseFloat((data.totalDowntime / data.count).toFixed(1)),
  }));
}

export function getTopFaults(filters: Partial<FilterState>, limit = 10): TopFault[] {
  const filtered = filterRecords(mockFaultRecords, filters);
  const faultMap = new Map<string, { desc: string; count: number; totalDowntime: number; ata: string }>();

  filtered.forEach(r => {
    if (!faultMap.has(r.faultCode)) {
      faultMap.set(r.faultCode, { desc: r.faultDescription, count: 0, totalDowntime: 0, ata: r.ataChapter });
    }
    const entry = faultMap.get(r.faultCode)!;
    entry.count++;
    entry.totalDowntime += r.downtimeHours;
  });

  return Array.from(faultMap.entries())
    .map(([code, data]) => ({
      faultCode: code,
      faultDescription: data.desc,
      count: data.count,
      avgDowntime: parseFloat((data.totalDowntime / data.count).toFixed(1)),
      ataChapter: data.ata,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getRepeatAircraft(filters: Partial<FilterState>): RepeatAircraft[] {
  const filtered = filterRecords(mockFaultRecords, filters);
  const acMap = new Map<string, { aircraftReg: string; aircraftType: string; faultCode: string; faultDescription: string; count: number; lastOccurrence: string }>();

  filtered.forEach(r => {
    const key = `${r.aircraftReg}-${r.faultCode}`;
    if (!acMap.has(key)) {
      acMap.set(key, {
        aircraftReg: r.aircraftReg,
        aircraftType: r.aircraftType,
        faultCode: r.faultCode,
        faultDescription: r.faultDescription,
        count: 0,
        lastOccurrence: r.occurrenceDate,
      });
    }
    const entry = acMap.get(key)!;
    entry.count++;
    if (r.occurrenceDate > entry.lastOccurrence) entry.lastOccurrence = r.occurrenceDate;
  });

  return Array.from(acMap.values())
    .filter(a => a.count >= 2)
    .sort((a, b) => b.count - a.count);
}

export function getCommonActions(filters: Partial<FilterState>): CommonAction[] {
  const filtered = filterRecords(mockFaultRecords, filters);
  const actionMap = new Map<string, { count: number; success: number }>();

  filtered.forEach(r => {
    r.actions.forEach(a => {
      if (!actionMap.has(a)) actionMap.set(a, { count: 0, success: 0 });
      const entry = actionMap.get(a)!;
      entry.count++;
      if (r.success) entry.success++;
    });
  });

  return Array.from(actionMap.entries())
    .map(([action, data]) => ({
      action,
      count: data.count,
      successRate: parseFloat(((data.success / data.count) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function getFaultDrillDown(filters: Partial<FilterState>, faultCode: string): FaultDrillDownData | null {
  const filtered = filterRecords(mockFaultRecords, filters).filter(r => r.faultCode === faultCode);
  if (filtered.length === 0) return null;

  const faultDesc = filtered[0].faultDescription;
  const ataChapter = filtered[0].ataChapter;
  const totalCount = filtered.length;
  const avgDowntime = parseFloat((filtered.reduce((s, r) => s + r.downtimeHours, 0) / totalCount).toFixed(1));

  const monthMap = new Map<string, { count: number; totalDowntime: number }>();
  filtered.forEach(r => {
    const month = r.occurrenceDate.substring(0, 7);
    if (!monthMap.has(month)) monthMap.set(month, { count: 0, totalDowntime: 0 });
    const m = monthMap.get(month)!;
    m.count++;
    m.totalDowntime += r.downtimeHours;
  });
  const monthlyTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      month,
      count: d.count,
      avgDowntime: parseFloat((d.totalDowntime / d.count).toFixed(1)),
    }))
    .slice(-6);

  const acMap = new Map<string, { reg: string; type: string; count: number; last: string; total: number }>();
  filtered.forEach(r => {
    if (!acMap.has(r.aircraftReg)) {
      acMap.set(r.aircraftReg, { reg: r.aircraftReg, type: r.aircraftType, count: 0, last: r.occurrenceDate, total: 0 });
    }
    const a = acMap.get(r.aircraftReg)!;
    a.count++;
    a.total += r.downtimeHours;
    if (r.occurrenceDate > a.last) a.last = r.occurrenceDate;
  });
  const involvedAircraft = Array.from(acMap.values())
    .map(a => ({
      aircraftReg: a.reg,
      aircraftType: a.type,
      count: a.count,
      lastOccurrence: a.last,
      totalDowntime: parseFloat(a.total.toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const ranges = [
    { label: '0-2h', min: 0, max: 2 },
    { label: '2-4h', min: 2, max: 4 },
    { label: '4-6h', min: 4, max: 6 },
    { label: '6-8h', min: 6, max: 8 },
    { label: '8h+', min: 8, max: 999 },
  ];
  const downtimeDistribution = ranges.map(r => ({
    range: r.label,
    count: filtered.filter(f => f.downtimeHours >= r.min && f.downtimeHours < r.max).length,
  }));

  const actMap = new Map<string, { count: number; success: number; totalDowntime: number }>();
  filtered.forEach(r => {
    r.actions.forEach(a => {
      if (!actMap.has(a)) actMap.set(a, { count: 0, success: 0, totalDowntime: 0 });
      const e = actMap.get(a)!;
      e.count++;
      e.totalDowntime += r.downtimeHours;
      if (r.success) e.success++;
    });
  });
  const actionDetails = Array.from(actMap.entries())
    .map(([action, d]) => ({
      action,
      count: d.count,
      successCount: d.success,
      successRate: parseFloat(((d.success / d.count) * 100).toFixed(1)),
      avgDowntime: parseFloat((d.totalDowntime / d.count).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  const repeatAcCount = involvedAircraft.filter(a => a.count >= 3).length;
  const highDowntimeRate = downtimeDistribution.filter(d => d.range === '6-8h' || d.range === '8h+').reduce((s, d) => s + d.count, 0) / totalCount;
  const lowSuccessActions = actionDetails.filter(a => a.successRate < 70).length;
  const needReview = totalCount >= 10 || avgDowntime >= 5 || repeatAcCount >= 2 || highDowntimeRate > 0.3 || lowSuccessActions >= 2;
  const reasons: string[] = [];
  if (totalCount >= 10) reasons.push(`发生频次较高（${totalCount}次）`);
  if (avgDowntime >= 5) reasons.push(`平均停场时间长（${avgDowntime}h）`);
  if (repeatAcCount >= 2) reasons.push(`涉及${repeatAcCount}架飞机重复故障`);
  if (highDowntimeRate > 0.3) reasons.push(`长时间停场占比高（${(highDowntimeRate * 100).toFixed(0)}%）`);
  if (lowSuccessActions >= 2) reasons.push(`${lowSuccessActions}项排故动作成功率低`);
  const reviewReason = reasons.length > 0 ? reasons.join('；') : '指标正常，建议持续关注';

  return {
    faultCode,
    faultDescription: faultDesc,
    ataChapter,
    totalCount,
    avgDowntime,
    monthlyTrend,
    involvedAircraft,
    downtimeDistribution,
    actionDetails,
    needReview,
    reviewReason,
  };
}

export function getKnowledgeEntries(): KnowledgeEntry[] {
  return [...mockKnowledgeEntries];
}

export function getLowSuccessRateEntries(): KnowledgeEntry[] {
  return mockKnowledgeEntries
    .filter(e => e.referenceCount >= 20 && e.successRate < 65)
    .sort((a, b) => a.successRate - b.successRate);
}

export function getCaseQualitySummaries(): CaseQualitySummary[] {
  return mockKnowledgeEntries
    .filter(e => !e.hasManualReference || !e.hasReleaseConclusion || !e.hasFollowUp)
    .map(e => ({
      entryId: e.id,
      faultCode: e.faultCode,
      title: e.title,
      category: e.category,
      lastUpdated: e.lastUpdated,
      referenceCount: e.referenceCount,
      hasManualReference: e.hasManualReference,
      hasReleaseConclusion: e.hasReleaseConclusion,
      hasFollowUp: e.hasFollowUp,
      missingCount:
        (e.hasManualReference ? 0 : 1) +
        (e.hasReleaseConclusion ? 0 : 1) +
        (e.hasFollowUp ? 0 : 1),
    }))
    .sort((a, b) => b.missingCount - a.missingCount || b.referenceCount - a.referenceCount);
}

export function generateCandidateTasks(
  filters: Partial<FilterState>,
  repeatThreshold: number,
  timeoutThreshold: number
): CandidateReviewTask[] {
  const filtered = filterRecords(mockFaultRecords, filters);
  const candidates: CandidateReviewTask[] = [];
  const existingCodes = new Set(mockReviewTasks.map(t => t.faultCode));

  const faultMap = new Map<string, {
    desc: string;
    count: number;
    totalDowntime: number;
    acMap: Map<string, number>;
    lastDate: string;
    ata: string;
  }>();

  filtered.forEach(r => {
    if (!faultMap.has(r.faultCode)) {
      faultMap.set(r.faultCode, {
        desc: r.faultDescription,
        count: 0,
        totalDowntime: 0,
        acMap: new Map(),
        lastDate: r.occurrenceDate,
        ata: r.ataChapter,
      });
    }
    const f = faultMap.get(r.faultCode)!;
    f.count++;
    f.totalDowntime += r.downtimeHours;
    f.acMap.set(r.aircraftReg, (f.acMap.get(r.aircraftReg) || 0) + 1);
    if (r.occurrenceDate > f.lastDate) f.lastDate = r.occurrenceDate;
  });

  Array.from(faultMap.entries()).forEach(([code, f], idx) => {
    if (existingCodes.has(code)) return;
    const avgDowntime = parseFloat((f.totalDowntime / f.count).toFixed(1));
    const repeatAc = Array.from(f.acMap.values()).filter(v => v >= 2).length;

    if (f.count >= repeatThreshold) {
      candidates.push({
        candidateId: `C-R-${String(idx + 1).padStart(4, '0')}`,
        type: 'repeat',
        faultCode: code,
        faultDescription: f.desc,
        ataChapter: f.ata,
        occurrenceCount: f.count,
        avgDowntime,
        involvedAircraftCount: f.acMap.size,
        lastOccurrence: f.lastDate,
        reason: `在筛选范围内发生 ${f.count} 次，超过重复阈值 ${repeatThreshold} 次，涉及 ${f.acMap.size} 架飞机（${repeatAc}架重复发生）`,
        selected: false,
      });
    } else if (avgDowntime >= timeoutThreshold) {
      candidates.push({
        candidateId: `C-T-${String(idx + 1).padStart(4, '0')}`,
        type: 'timeout',
        faultCode: code,
        faultDescription: f.desc,
        ataChapter: f.ata,
        occurrenceCount: f.count,
        avgDowntime,
        thresholdHours: timeoutThreshold,
        involvedAircraftCount: f.acMap.size,
        lastOccurrence: f.lastDate,
        reason: `平均停场 ${avgDowntime}h，超过超时阈值 ${timeoutThreshold}h`,
        selected: false,
      });
    }
  });

  return candidates.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
}

let customAddedTasks: ReviewTask[] = [];

export function getReviewTasks(): ReviewTask[] {
  return [...mockReviewTasks, ...customAddedTasks];
}

export function assignTask(taskId: string, assignee: string, dueDate: string): ReviewTask | null {
  const allTasks = getReviewTasks();
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return null;
  task.assignee = assignee;
  task.dueDate = dueDate;
  task.status = 'in_progress';
  return task;
}

export function updateTask(
  taskId: string,
  updates: Partial<{
    rootCause: string;
    tipRevision: string;
    trainingReminder: { content: string; sent: boolean };
    status: 'pending' | 'in_progress' | 'completed';
  }>
): ReviewTask | null {
  const allTasks = getReviewTasks();
  const task = allTasks.find(t => t.id === taskId);
  if (!task) return null;
  if (updates.rootCause !== undefined) task.rootCause = updates.rootCause;
  if (updates.tipRevision !== undefined) task.tipRevision = updates.tipRevision;
  if (updates.trainingReminder !== undefined) task.trainingReminder = updates.trainingReminder;
  if (updates.status !== undefined) {
    task.status = updates.status;
    if (updates.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString().split('T')[0];
    }
  } else if (
    updates.rootCause &&
    updates.tipRevision &&
    task.status !== 'completed'
  ) {
    task.status = 'completed';
    if (!task.completedAt) {
      task.completedAt = new Date().toISOString().split('T')[0];
    }
  }
  return task;
}

export function addTasksFromCandidates(candidates: CandidateReviewTask[]): ReviewTask[] {
  const today = new Date().toISOString().split('T')[0];
  const plus7 = new Date();
  plus7.setDate(plus7.getDate() + 7);
  const defaultDue = plus7.toISOString().split('T')[0];
  const newTasks: ReviewTask[] = candidates.map((c, i) => ({
    id: `N${String(customAddedTasks.length + i + 1).padStart(4, '0')}`,
    type: c.type,
    faultCode: c.faultCode,
    title: c.faultDescription,
    ataChapter: c.ataChapter,
    occurrenceCount: c.occurrenceCount,
    avgDowntime: c.avgDowntime,
    thresholdHours: c.thresholdHours,
    assignee: null,
    status: 'pending',
    rootCause: null,
    tipRevision: null,
    trainingReminder: { content: '', sent: false },
    createdAt: today,
    dueDate: defaultDue,
    completedAt: null,
  }));
  customAddedTasks = [...customAddedTasks, ...newTasks];
  return newTasks;
}

export function getOptions() {
  return optionData;
}
