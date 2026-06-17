import { Router, type Request, type Response } from 'express';
import {
  getFaults,
  getFaultStatistics,
  getHeatmapData,
  getTopFaults,
  getRepeatAircraft,
  getCommonActions,
  getKnowledgeEntries,
  getLowSuccessRateEntries,
  getCaseQualitySummaries,
  getReviewTasks,
  assignTask,
  updateTask,
  getOptions,
  getFaultDrillDown,
  generateCandidateTasks,
  addTasksFromCandidates,
  initiateReviewFromDrilldown,
  addTaskFromCaseQuality,
  getTaskWorkbench,
  getTopFaultByAta,
  updateTaskWorkbench,
  getFaultCodeAggregate,
} from '../services/dataService.js';

const router = Router();

function parseFilters(req: Request) {
  const q = req.query;
  return {
    aircraftType: (q.aircraftType as string) || null,
    base: (q.base as string) || null,
    ataChapter: (q.ataChapter as string) || null,
    season: (q.season as string) || null,
    faultCode: (q.faultCode as string) || null,
    dateRange: (q.dateStart || q.dateEnd) ? {
      start: (q.dateStart as string) || '',
      end: (q.dateEnd as string) || '',
    } : undefined,
  };
}

router.get('/faults', (req: Request, res: Response) => {
  res.json({ success: true, data: getFaults(parseFilters(req)) });
});

router.get('/faults/statistics', (req: Request, res: Response) => {
  res.json({ success: true, data: getFaultStatistics(parseFilters(req)) });
});

router.get('/faults/heatmap', (req: Request, res: Response) => {
  res.json({ success: true, data: getHeatmapData(parseFilters(req)) });
});

router.get('/faults/top', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  res.json({ success: true, data: getTopFaults(parseFilters(req), limit) });
});

router.get('/faults/repeat-aircraft', (req: Request, res: Response) => {
  res.json({ success: true, data: getRepeatAircraft(parseFilters(req)) });
});

router.get('/faults/common-actions', (req: Request, res: Response) => {
  res.json({ success: true, data: getCommonActions(parseFilters(req)) });
});

router.get('/faults/drill-down', (req: Request, res: Response) => {
  const faultCode = req.query.faultCode as string;
  if (!faultCode) {
    res.status(400).json({ success: false, error: 'faultCode is required' });
    return;
  }
  const result = getFaultDrillDown(parseFilters(req), faultCode);
  if (!result) {
    res.status(404).json({ success: false, error: 'Fault not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.get('/faults/top-by-ata', (req: Request, res: Response) => {
  const ataChapter = req.query.ataChapter as string;
  if (!ataChapter) {
    res.status(400).json({ success: false, error: 'ataChapter is required' });
    return;
  }
  const result = getTopFaultByAta(parseFilters(req), ataChapter);
  res.json({ success: true, data: result });
});

router.get('/faults/aggregate/:faultCode', (req: Request, res: Response) => {
  const { faultCode } = req.params;
  const result = getFaultCodeAggregate(faultCode);
  if (!result) {
    res.status(404).json({ success: false, error: 'Fault code not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.get('/knowledge/entries', (_req: Request, res: Response) => {
  res.json({ success: true, data: getKnowledgeEntries() });
});

router.get('/knowledge/low-success-rate', (_req: Request, res: Response) => {
  res.json({ success: true, data: getLowSuccessRateEntries() });
});

router.get('/knowledge/quality-summaries', (_req: Request, res: Response) => {
  res.json({ success: true, data: getCaseQualitySummaries() });
});

router.get('/review/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, data: getReviewTasks() });
});

router.get('/review/candidate-tasks', (req: Request, res: Response) => {
  const repeatThreshold = parseInt((req.query.repeatThreshold as string) || '10');
  const timeoutThreshold = parseFloat((req.query.timeoutThreshold as string) || '5');
  res.json({
    success: true,
    data: generateCandidateTasks(parseFilters(req), repeatThreshold, timeoutThreshold),
  });
});

router.post('/review/add-candidates', (req: Request, res: Response) => {
  const candidates = req.body.candidates || [];
  if (!Array.isArray(candidates) || candidates.length === 0) {
    res.status(400).json({ success: false, error: 'candidates array is required' });
    return;
  }
  const result = addTasksFromCandidates(candidates);
  res.json({ success: true, data: result });
});

router.post('/review/initiate-from-drilldown', (req: Request, res: Response) => {
  const { faultCode, reason } = req.body;
  if (!faultCode) {
    res.status(400).json({ success: false, error: 'faultCode is required' });
    return;
  }
  const result = initiateReviewFromDrilldown(parseFilters(req), faultCode, reason || '');
  res.json({ success: true, data: result });
});

router.post('/review/add-from-case-quality', (req: Request, res: Response) => {
  const { entryId } = req.body;
  if (!entryId) {
    res.status(400).json({ success: false, error: 'entryId is required' });
    return;
  }
  const result = addTaskFromCaseQuality(entryId);
  res.json({ success: true, data: result });
});

router.get('/review/workbench/:taskId', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const result = getTaskWorkbench(parseFilters(req), taskId);
  if (!result) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.put('/review/workbench/:taskId', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { reviewConclusion, adoptedActions, knowledgeDrafts } = req.body;
  const result = updateTaskWorkbench(taskId, {
    reviewConclusion,
    adoptedActions,
    knowledgeDrafts,
  });
  if (!result) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.post('/review/tasks/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { assignee, dueDate } = req.body;
  const result = assignTask(id, assignee, dueDate);
  if (!result) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.put('/review/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = updateTask(id, req.body);
  if (!result) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: result });
});

router.get('/options/aircraft-types', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().aircraftTypes });
});

router.get('/options/bases', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().bases });
});

router.get('/options/ata-chapters', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().ataChapters });
});

router.get('/options/seasons', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().seasons });
});

router.get('/options/fault-codes', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().faultCodes });
});

router.get('/options/engineers', (_req: Request, res: Response) => {
  res.json({ success: true, data: getOptions().engineers });
});

export default router;
