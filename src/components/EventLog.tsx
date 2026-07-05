import React from 'react';
import { useSimulationStore } from '../store';
import { Terminal, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export const EventLog: React.FC = () => {
  const { logs } = useSimulationStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'INFO': return <Info className="w-3.5 h-3.5 text-accent-blue" />;
      case 'WARNING': return <AlertTriangle className="w-3.5 h-3.5 text-accent-orange" />;
      case 'EMERGENCY': return <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />;
      case 'SUCCESS': return <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />;
      default: return <Terminal className="w-3.5 h-3.5 text-dark-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-dark-700/30 flex items-center gap-2 shrink-0">
        <Terminal className="w-3.5 h-3.5 text-dark-500" />
        <h2 className="text-[10px] font-bold text-dark-500 uppercase tracking-wider">Event Log</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
        {logs.map(log => (
          <div key={log.id} className="flex items-start gap-2 py-1 px-2 hover:bg-dark-800/30 rounded transition-colors">
            <span className="text-dark-600 shrink-0 w-16">{format(log.timestamp, 'HH:mm:ss')}</span>
            <span className="shrink-0 pt-0.5">{getIcon(log.type)}</span>
            <span className={clsx(
              "flex-1 leading-relaxed",
              log.type === 'EMERGENCY' ? 'text-accent-red font-semibold' :
              log.type === 'WARNING' ? 'text-accent-orange' :
              log.type === 'SUCCESS' ? 'text-accent-green' :
              'text-dark-500'
            )}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-dark-600 text-center py-4 text-xs">No events recorded.</div>
        )}
      </div>
    </div>
  );
};
