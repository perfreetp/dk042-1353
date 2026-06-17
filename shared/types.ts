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
  ataChapter: string;
  category: string;
  referenceCount: number;
  successRate: number;
  lastUpdated: string;
  hasManualReference: boolean;
  hasReleaseConclusion: boolean;
  hasFollowUp: boolean;
}

export interface ReviewTask {
  id: string;
  type: 'repeat' | 'timeout';
  faultCode: string;
  title: string;
  ataChapter: string;
  occurrenceCount: number;
  avgDowntime: number;
  thresholdHours?: number;
  assignee: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  rootCause: string | null;
  tipRevision: string | null;
  trainingReminder: { content: string; sent: boolean };
  createdAt: string;
  dueDate: string;
  completedAt: string | null;
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

export interface CaseQualitySummary {
  entryId: string;
  faultCode: string;
  title: string;
  category: string;
  lastUpdated: string;
  referenceCount: number;
  hasManualReference: boolean;
  hasReleaseConclusion: boolean;
  hasFollowUp: boolean;
  missingCount: number;
}

export interface OptionItem {
  value: string;
  label: string;
}

export interface FaultDrillDownData {
  faultCode: string;
  faultDescription: string;
  ataChapter: string;
  totalCount: number;
  avgDowntime: number;
  monthlyTrend: { month: string; count: number; avgDowntime: number }[];
  involvedAircraft: {
    aircraftReg: string;
    aircraftType: string;
    count: number;
    lastOccurrence: string;
    totalDowntime: number;
  }[];
  downtimeDistribution: { range: string; count: number }[];
  actionDetails: {
    action: string;
    count: number;
    successCount: number;
    successRate: number;
    avgDowntime: number;
  }[];
  needReview: boolean;
  reviewReason: string;
}

export interface CandidateReviewTask {
  candidateId: string;
  type: 'repeat' | 'timeout';
  faultCode: string;
  faultDescription: string;
  ataChapter: string;
  occurrenceCount: number;
  avgDowntime: number;
  thresholdHours?: number;
  involvedAircraftCount: number;
  lastOccurrence: string;
  reason: string;
  selected: boolean;
}
