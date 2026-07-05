import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, FastForward } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  speed: number;
  currentStep: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying, speed, currentStep, totalSteps,
  onPlay, onPause, onStepForward, onStepBackward, onReset, onSpeedChange,
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="glass-card p-4">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-dark-500 mb-1">
          <span>Step {currentStep} / {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={onReset} className="btn-ghost p-2" title="Reset">
          <RotateCcw className="w-4 h-4" />
        </button>
        <button onClick={onStepBackward} className="btn-ghost p-2" title="Step Back" disabled={currentStep <= 0}>
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-accent-blue hover:bg-accent-blue/30 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={onStepForward} className="btn-ghost p-2" title="Step Forward" disabled={currentStep >= totalSteps}>
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Speed Control */}
        <div className="flex items-center gap-1 ml-2 bg-dark-800/60 rounded-lg px-2 py-1 border border-dark-700/50">
          <FastForward className="w-3 h-3 text-dark-500" />
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-16 h-1 accent-accent-blue cursor-pointer"
          />
          <span className="text-xs text-dark-500 w-6">{speed}x</span>
        </div>
      </div>
    </div>
  );
};
