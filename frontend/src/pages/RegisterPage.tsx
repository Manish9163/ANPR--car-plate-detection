import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanLine, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.register({ email, username, password });
      api.setSavedUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <ScanLine className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold text-text-primary tracking-tight">PlateVision</span>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1">Create account</h2>
        <p className="text-sm text-text-muted mb-6">
          Register to access recognition history, analytics, and admin features.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-muted border border-error/20 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            required
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-4 h-4" />}
          />
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-text-muted text-center mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
