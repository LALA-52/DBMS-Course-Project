import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Notification({ notification, onClose }) {
  useEffect(() => {
    if (notification && notification.autoClose !== false) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: 'border-emerald-300',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      title: 'Success'
    },
    error: {
      icon: XCircle,
      border: 'border-rose-300',
      bg: 'bg-rose-50',
      text: 'text-rose-900',
      iconColor: 'text-rose-600',
      title: 'Database Error'
    },
    warning: {
      icon: AlertTriangle,
      border: 'border-amber-300',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      iconColor: 'text-amber-600',
      title: 'Notice'
    },
    info: {
      icon: Info,
      border: 'border-sky-300',
      bg: 'bg-sky-50',
      text: 'text-sky-900',
      iconColor: 'text-sky-600',
      title: 'Information'
    }
  };

  const config = typeConfig[notification.type || 'info'];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full shadow-lg transition-all animate-bounce-short">
      <div className={`p-4 rounded-xl border ${config.border} ${config.bg} ${config.text} flex items-start space-x-3 shadow-md`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{notification.title || config.title}</p>
          <p className="text-xs mt-0.5 leading-relaxed">{notification.message}</p>
          {notification.sql && (
            <div className="mt-2 p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded overflow-x-auto">
              <code>{notification.sql}</code>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
