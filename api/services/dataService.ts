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
  QualityIssue,
} from '../../shared/types.js';

function filterRecords(records: FaultRecord[], filters: Partial<FilterState>): FaultRecord[] {
  return records.filter(r => {
    if (filters.aircraftType && r.aircraftType !== filters.aircraftType) return false;
    if (filters.base && r.base !== filters.base) return false;
    if (filters.ataChapter && r.ataChapter !== filters.ataChapter) return false;
    if (filters.season && r.season !== filters.season) return false;
    if (filters.faultCode && r.faultCode !== filters.faultCode) return false;
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

export function getKnowledgeEntries(): KnowledgeEntry[] {
  return [...mockKnowledgeEntries];
}

export function getLowSuccessRateEntries(): KnowledgeEntry[] {
  return mockKnowledgeEntries
    .filter(e => e.referenceCount >= 20 && e.successRate < 65)
    .sort((a, b) => a.successRate - b.successRate);
}

export function getQualityIssues(): QualityIssue[] {
  const issues: QualityIssue[] = [];
  mockKnowledgeEntries.forEach(e => {
    if (!e.hasManualReference) {
      issues.push({
        id: `${e.id}-m`,
        faultCode: e.faultCode,
        faultDescription: e.title,
        issueType: 'missing_manual',
        caseTitle: e.title,
        reportedDate: e.lastUpdated,
      });
    }
    if (!e.hasReleaseConclusion) {
      issues.push({
        id: `${e.id}-r`,
        faultCode: e.faultCode,
        faultDescription: e.title,
        issueType: 'missing_release',
        caseTitle: e.title,
        reportedDate: e.lastUpdated,
      });
    }
    if (!e.hasFollowUp) {
      issues.push({
        id: `${e.id}-f`,
        faultCode: e.faultCode,
        faultDescription: e.title,
        issueType: 'missing_followup',
        caseTitle: e.title,
        reportedDate: e.lastUpdated,
      });
    }
  });
  return issues;
}

export function getReviewTasks(): ReviewTask[] {
  return [...mockReviewTasks];
}

export function assignTask(taskId: string, assignee: string, dueDate: string): ReviewTask | null {
  const task = mockReviewTasks.find(t => t.id === taskId);
  if (!task) return null;
  task.assignee = assignee;
  task.dueDate = dueDate;
  task.status = 'in_progress';
  return task;
}

export function updateTask(
  taskId: string,
  updates: Partial<{
    rootCauseAnalysis: string;
    troubleshootingTipRevision: string;
    trainingReminder: boolean;
    status: 'pending' | 'in_progress' | 'completed';
  }>
): ReviewTask | null {
  const task = mockReviewTasks.find(t => t.id === taskId);
  if (!task) return null;
  if (updates.rootCauseAnalysis !== undefined) task.rootCauseAnalysis = updates.rootCauseAnalysis;
  if (updates.troubleshootingTipRevision !== undefined) task.troubleshootingTipRevision = updates.troubleshootingTipRevision;
  if (updates.trainingReminder !== undefined) task.trainingReminder = updates.trainingReminder;
  if (updates.status !== undefined) task.status = updates.status;
  return task;
}

export function getOptions() {
  return optionData;
}
