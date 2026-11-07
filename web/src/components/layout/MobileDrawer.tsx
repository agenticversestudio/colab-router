import React from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TelemetryPanel } from '../mission-control/TelemetryPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sidebar' | 'telemetry';
  onOpenMCP?: () => void;
  onOpenMemory?: () => void;
  onOpenPersonas?: () => void;
}

export const MobileDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  onOpenMCP,
  onOpenMemory,
  onOpenPersonas
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <div className={`relative z-10 flex h-full w-[85%] max-w-sm flex-col bg-[#080C14] shadow-2xl transition-transform ${
        mode === 'sidebar' ? 'mr-auto animate-slide-right' : 'ml-auto animate-slide-left'
      }`}>
        {/* Close Button Header */}
        <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {mode === 'sidebar' ? 'Sessions & History' : 'Telemetry & Shift'}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'sidebar' ? (
            <Sidebar
              onCloseMobile={onClose}
              onOpenMCP={onOpenMCP}
              onOpenMemory={onOpenMemory}
              onOpenPersonas={onOpenPersonas}
            />
          ) : (
            <TelemetryPanel />
          )}
        </div>
      </div>
    </div>
  );
};
