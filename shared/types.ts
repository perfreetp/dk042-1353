export interface FaultRecord {
  id: string;
  faultCode: string;
  faultDescription: string;
  aircraftType: string;
  base: string;
  ataChapter: string;
  ataChapterName: string;
  season: string;
  occurrenceDate: string;
  aircraftReg: string;
  downtimeHours: number;
  actions: string[];
  success: boolean;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  faultCode: string;
  referenceCount: number;
  successRate: number;
  lastUpdated: string;
  hasManualReference: boolean;
  hasReleaseConclusion: boolean;
  hasFollowUp: boolean;
}

export interface ReviewTask {
  id: string;
  type: 'repeat_fault' | 'timeout_troubleshoot';
  faultCode: string;
  faultDescription: string;
  occurrenceCount: number;
  avgDowntimeHours: number;
  thresholdHours?: number;
  assignee: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  rootCauseAnalysis: string | null;
  troubleshootingTipRevision: string | null;
  trainingReminder: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface FilterState {
  aircraftType: string | null;
  base: string | null;
  ataChapter: string | null;
  season: string | null;
  faultCode: string | null;
  dateRange: { start: string; end: string };
}

export interface FaultStatistics {
  totalFaults: number;
  avgDowntime: number;
  repeatAircraftCount: number;
  commonActionsCount: number;
  faultTrend: { month: string; count: number }[];
}

export interface HeatmapData {
  ataChapter: string;
  ataChapterName: string;
  count: number;
  avgDowntime: number;
}

export interface TopFault {
  faultCode: string;
  faultDescription: string;
  count: number;
  avgDowntime: number;
  ataChapter: string;
}

export interface RepeatAircraft {
  aircraftReg: string;
  aircraftType: string;
  faultCode: string;
  faultDescription: string;
  count: number;
  lastOccurrence: string;
}

export interface CommonAction {
  action: string;
  count: number;
  successRate: number;
}

export interface QualityIssue {
  id: string;
  faultCode: string;
  faultDescription: string;
  issueType: 'missing_manual' | 'missing_release' | 'missing_followup';
  caseTitle: string;
  reportedDate: string;
}

export interface OptionItem {
  value: string;
  label: string;
}
