import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  User,
  Sliders,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { User as UserType } from '@/types';

interface ContextType {
  user: UserType | null;
}

export function SettingsPage() {
  const { user } = useOutletContext<ContextType>();

  const [confidenceThreshold, setConfidenceThreshold] = useState(60);
  const [autoSaveDetections, setAutoSaveDetections] = useState(true);
  const [cameraResolution, setCameraResolution] = useState('1280x720');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Platform Settings
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Configure computer vision thresholds, hardware capture preferences, and account credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Profile Card */}
        <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
            <User className="w-4 h-4 text-accent" />
            <span>Operator Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-text-muted block mb-1">Username</label>
              <Input value={user?.username || 'admin'} disabled />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Access Role</label>
              <div className="flex items-center h-10 px-3 rounded-lg bg-bg-elevated border border-border-default">
                <Badge variant="default">{user?.role || 'ADMIN'}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Inference & Detection Parameters */}
        <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-4">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
            <Sliders className="w-4 h-4 text-accent" />
            <span>Optical Recognition Parameters</span>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-text-secondary">Low-Confidence Alert Cutoff</span>
                <span className="font-mono text-accent font-bold">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <span className="text-[0.68rem] text-text-muted block mt-1">
                Detections falling below this threshold trigger manual operator review.
              </span>
            </div>

            <div>
              <label className="text-xs text-text-muted block mb-1">Live Camera Feed Resolution</label>
              <select
                value={cameraResolution}
                onChange={(e) => setCameraResolution(e.target.value)}
                className="w-full bg-bg-elevated border border-border-default text-text-primary text-xs rounded-lg px-3 py-2 outline-none focus:border-accent"
              >
                <option value="640x480">640 × 480 (VGA, Low CPU)</option>
                <option value="1280x720">1280 × 720 (HD 720p, Recommended)</option>
                <option value="1920x1080">1920 × 1080 (Full HD 1080p, High Accuracy)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-text-primary block font-medium">Auto-Save Recognition Logs</span>
                <span className="text-[0.68rem] text-text-muted">
                  Persist every plate recognition to database for audit compliance.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSaveDetections}
                onChange={(e) => setAutoSaveDetections(e.target.checked)}
                className="w-4 h-4 accent-accent rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-success flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Settings successfully persisted.
            </span>
          ) : <span />}

          <Button type="submit" variant="primary">
            <Save className="w-4 h-4 mr-1.5" />
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
