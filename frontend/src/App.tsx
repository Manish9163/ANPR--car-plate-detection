import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecognizePage } from './pages/RecognizePage';
import { LivePage } from './pages/LivePage';
import { VideoPage } from './pages/VideoPage';
import { HistoryPage } from './pages/HistoryPage';
import { PipelinePage } from './pages/PipelinePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VivaGuidePage } from './pages/VivaGuidePage';
import { AdminUsersPage } from './pages/AdminUsersPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ── Application Platform Routes (AppLayout Shell) ── */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/recognize" element={<RecognizePage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/pipeline-visualizer" element={<PipelinePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/viva" element={<VivaGuidePage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
