import React from 'react';
import { Code } from 'lucide-react';

interface PseudocodePanelProps {
  title: string;
  lines: string[];
  highlightedLine: number; // 0-indexed
  className?: string;
}

export const PseudocodePanel: React.FC<PseudocodePanelProps> = ({
  title, lines, highlightedLine, className = ''
}) => {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <h3 className="section-header"><Code className="w-4 h-4" /> {title}</h3>
      <div className="font-mono text-[11px] leading-5 bg-dark-950/60 rounded-lg p-3 border border-dark-700/30 overflow-x-auto">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`px-2 py-0.5 rounded transition-all duration-300 ${
              idx === highlightedLine
                ? 'bg-accent-blue/15 text-accent-blue border-l-2 border-accent-blue'
                : 'text-dark-500 border-l-2 border-transparent'
            }`}
          >
            <span className="inline-block w-6 text-right mr-3 text-dark-600 select-none">{idx + 1}</span>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};
