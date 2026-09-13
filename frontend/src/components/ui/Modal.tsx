import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus trap: focus the modal content
      contentRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Content */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-bg-surface border border-border-default rounded-xl
          shadow-xl animate-fade-in-up
          outline-none
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-5 pb-0">
            <div className="flex items-start justify-between">
              <div>
                {title && (
                  <h3 id="modal-title" className="text-base font-semibold text-text-primary">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="mt-1 text-sm text-text-muted">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-bg-elevated transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
