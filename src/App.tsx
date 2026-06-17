import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FaultHeatmap from '@/pages/FaultHeatmap';
import CaseQuality from '@/pages/CaseQuality';
import ReviewChecklist from '@/pages/ReviewChecklist';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/fault-heatmap" replace />} />
        <Route path="/fault-heatmap" element={<FaultHeatmap />} />
        <Route path="/case-quality" element={<CaseQuality />} />
        <Route path="/review-checklist" element={<ReviewChecklist />} />
        <Route path="*" element={<Navigate to="/fault-heatmap" replace />} />
      </Routes>
    </Router>
  );
}
