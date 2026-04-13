/**
 * 通用模态框
 */
import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* 内容 */}
      <div className="relative bg-surface-light rounded-2xl border border-gray-700 shadow-2xl w-full max-w-lg mx-4 animate-slide-up">
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
