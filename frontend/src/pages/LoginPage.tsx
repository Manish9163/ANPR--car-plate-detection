import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanLine, Mail, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const data = await api.login(formData);
      api.setSavedUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      setEmail('admin@platevision.ai');
      setPassword('AdminPassword@123');
    } else {
      setEmail('operator@platevision.ai');
      setPassword('OperatorPassword@123');
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* ── Left: Brand Panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-bg-surface border-r border-border-subtle p-10">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-text-primary tracking-tight">PlateVision</span>
          </div>

          <h1 className="text-3xl font-bold text-text-primary leading-tight mb-4">
            Intelligent plate
            <br />recognition system
          </h1>
          <p className="text-sm text-text-secondary max-w-md leading-relaxed">
            Computer vision pipeline with YOLOv8 detection, multi-tier OCR,
            and Indian registration validation. Authenticate to access the full platform.
          </p>
        </div>

        {/* Subtle detection visual */}
        <div className="mt-12 p-6 border border-border-subtle rounded-xl bg-bg-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-xs font-mono text-text-muted">System online</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Detection model</span>
              <span className="font-mono text-text-secondary">YOLOv8 + Contour</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">OCR engine</span>
              <span className="font-mono text-text-secondary">EasyOCR + Classical</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Authentication</span>
              <span className="font-mono text-text-secondary">Argon2id + JWT</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <ScanLine className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-text-primary tracking-tight">PlateVision</span>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-1">Sign in</h2>
          <p className="text-sm text-text-muted mb-6">
            Enter your credentials to access the platform.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-muted border border-error/20 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              placeholder="user@platevision.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" className="w-full" loading={loading}>
              {loading ? 'Authenticating...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-text-muted text-center mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
              Create one
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 pt-6 border-t border-border-subtle">
            <div className="flex items-center gap-1.5 text-xs text-text-muted mb-3">
              <Zap className="w-3 h-3 text-warning" />
              <span className="font-medium">Quick demo access</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => fillDemo('admin')}>
                Admin
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => fillDemo('operator')}>
                Operator
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
