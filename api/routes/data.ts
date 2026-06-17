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
  getQualityIssues,
  getReviewTasks,
  assignTask,
  updateTask,
  getOptions,
} from '../services/dataService.js';

const router = Router();

router.get('/faults', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  res.json({ success: true, data: getFaults(filters) });
});

router.get('/faults/statistics', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  res.json({ success: true, data: getFaultStatistics(filters) });
});

router.get('/faults/heatmap', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  res.json({ success: true, data: getHeatmapData(filters) });
});

router.get('/faults/top', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  const limit = parseInt(req.query.limit as string) || 10;
  res.json({ success: true, data: getTopFaults(filters, limit) });
});

router.get('/faults/repeat-aircraft', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  res.json({ success: true, data: getRepeatAircraft(filters) });
});

router.get('/faults/common-actions', (req: Request, res: Response) => {
  const filters = {
    aircraftType: (req.query.aircraftType as string) || null,
    base: (req.query.base as string) || null,
    ataChapter: (req.query.ataChapter as string) || null,
    season: (req.query.season as string) || null,
    faultCode: (req.query.faultCode as string) || null,
  };
  res.json({ success: true, data: getCommonActions(filters) });
});

router.get('/knowledge/entries', (_req: Request, res: Response) => {
  res.json({ success: true, data: getKnowledgeEntries() });
});

router.get('/knowledge/low-success-rate', (_req: Request, res: Response) => {
  res.json({ success: true, data: getLowSuccessRateEntries() });
});

router.get('/knowledge/quality-issues', (_req: Request, res: Response) => {
  res.json({ success: true, data: getQualityIssues() });
});

router.get('/review/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, data: getReviewTasks() });
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
