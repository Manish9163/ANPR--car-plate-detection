import { Outlet, Link, useLocation } from 'react-router-dom';
import { ScanLine, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PublicLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border-subtle bg-bg-primary/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
              <ScanLine className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              PlateVision
            </span>
            <span className="text-[0.5625rem] font-semibold text-accent uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 hidden sm:block">
              CV · ANPR
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {!isAuthPage && (
              <>
                <Link
                  to="/viva"
                  className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors hidden md:block"
                >
                  Architecture &amp; Defense
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/dashboard">
                  <Button variant="primary" size="sm">
                    Enter Platform
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </>
            )}
            {isAuthPage && (
              <Link
                to="/"
                className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                ← Back to Home
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      {!isAuthPage && (
        <footer className="border-t border-border-subtle py-6 bg-bg-surface/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-disabled">
            <div className="flex items-center gap-2">
              <ScanLine className="w-3 h-3 text-accent" />
              <span className="font-semibold text-text-muted">PlateVision</span>
              <span>—</span>
              <span>Automated Number Plate Recognition</span>
            </div>
            <span className="font-mono text-[0.6875rem]">Computer Vision &amp; Image Processing</span>
          </div>
        </footer>
      )}
    </div>
  );
}
