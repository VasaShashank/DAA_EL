import React, { useState, useEffect, useCallback } from 'react';
import { useSimulationStore } from '../store';
import { bfs } from '../utils/algorithms/graphTraversal';
import { dijkstra } from '../utils/algorithms/dijkstra';
import type { NodeId } from '../types';
import { StatsPanel } from '../components/visualizers/StatsPanel';
import { BinNode } from '../components/BinNode';
import { RoadEdge } from '../components/RoadEdge';
import { AlertTriangle, Zap, RotateCcw, Route } from 'lucide-react';
import type { AlgorithmStats } from '../types';

export const RoadFailurePage: React.FC = () => {
  const { nodes, edges, generateCity, toggleRoad } = useSimulationStore();
  const [, setBlockedEdges] = useState<{ source: NodeId; target: NodeId }[]>([]);
  const [reroutePath, setReroutePath] = useState<NodeId[]>([]);
  const [stats, setStats] = useState<AlgorithmStats | null>(null);
  const [connectivityInfo, setConnectivityInfo] = useState<string>('');
  const [mode, setMode] = useState<'block' | 'route'>('block');
  const [startNode] = useState<NodeId>(0);
  const [endNode, setEndNode] = useState<NodeId | null>(null);

  useEffect(() => { if (nodes.length === 0) generateCity(); }, [nodes.length, generateCity]);

  const handleEdgeClick = useCallback((source: NodeId, target: NodeId) => {
    if (mode !== 'block') return;
    toggleRoad(source, target);

    const edge = edges.find(e =>
      (e.source === source && e.target === target) || (e.source === target && e.target === source)
    );
    if (edge) {
      if (!edge.isBlocked) {
        setBlockedEdges(prev => [...prev, { source, target }]);
      } else {
        setBlockedEdges(prev => prev.filter(b =>
          !((b.source === source && b.target === target) || (b.source === target && b.target === source))
        ));
      }
    }

    // Check connectivity
    setTimeout(() => {
      const updatedEdges = useSimulationStore.getState().edges;
      const result = bfs(0, nodes, updatedEdges, false);
      if (result.isConnected) {
        setConnectivityInfo(`Graph is connected (${result.visitOrder.length} nodes reachable)`);
      } else {
        setConnectivityInfo(`Graph DISCONNECTED! ${result.components.length} components found`);
      }
    }, 100);
  }, [mode, edges, nodes, toggleRoad]);

  const randomFailure = useCallback(() => {
    const activeEdges = edges.filter(e => !e.isBlocked);
    if (activeEdges.length === 0) return;
    const randomEdge = activeEdges[Math.floor(Math.random() * activeEdges.length)];
    handleEdgeClick(randomEdge.source, randomEdge.target);
  }, [edges, handleEdgeClick]);

  const repairAll = useCallback(() => {
    const state = useSimulationStore.getState();
    state.edges.forEach(e => {
      if (e.isBlocked) {
        toggleRoad(e.source, e.target);
      }
    });
    setBlockedEdges([]);
    setReroutePath([]);
    setConnectivityInfo('All roads repaired');
  }, [toggleRoad]);

  const findRoute = useCallback(() => {
    if (endNode === null) return;
    const currentEdges = useSimulationStore.getState().edges;
    const result = dijkstra(startNode, endNode, nodes, currentEdges, false);
    setReroutePath(result.path);
    setStats(result.stats);
    if (result.path.length === 0) {
      setConnectivityInfo('No path found! Road failures have disconnected the graph.');
    }
  }, [startNode, endNode, nodes]);

  const handleNodeClick = (id: NodeId) => {
    if (mode === 'route') {
      if (startNode === 0 && id !== 0) {
        setEndNode(id);
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-14 glass-panel flex items-center justify-between px-5 shrink-0 border-b border-dark-700/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent-red" />
          <h2 className="text-sm font-semibold text-white">Road Failure Simulation</h2>
          <span className="text-xs text-dark-500 ml-2">BFS/DFS Connectivity + Dijkstra Rerouting</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode(mode === 'block' ? 'route' : 'block')}
            className={`btn-ghost text-xs py-1.5 ${mode === 'block' ? 'text-accent-red' : 'text-accent-blue'}`}>
            Mode: {mode === 'block' ? '🔨 Block Roads' : '🔍 Set Route'}
          </button>
          <button onClick={randomFailure} className="btn-danger py-1.5 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Random Failure
          </button>
          <button onClick={repairAll} className="btn-success py-1.5 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> Repair All
          </button>
          {mode === 'route' && endNode !== null && (
            <button onClick={findRoute} className="btn-primary py-1.5 flex items-center gap-1">
              <Route className="w-3.5 h-3.5" /> Find Route
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-3">
          <div className="w-full h-full bg-dark-950 rounded-xl border border-dark-700/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-50" />

            {/* Instructions */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-dark-800/90 backdrop-blur px-4 py-2 rounded-lg border border-dark-700/50">
              <span className="text-xs text-dark-500">
                {mode === 'block'
                  ? 'Click on edges (roads) to block/unblock them'
                  : 'Click a bin to set end node, then Find Route'}
              </span>
            </div>

            <svg viewBox="0 0 1200 900" className="w-full h-full relative z-10">
              {edges.map((edge, idx) => {
                const src = nodes.find(n => n.id === edge.source)!;
                const tgt = nodes.find(n => n.id === edge.target)!;
                const isInReroute = reroutePath.length > 1 && reroutePath.some((_n, i) =>
                  i < reroutePath.length - 1 &&
                  ((reroutePath[i] === edge.source && reroutePath[i+1] === edge.target) ||
                   (reroutePath[i] === edge.target && reroutePath[i+1] === edge.source))
                );

                return (
                  <g key={idx}>
                    <RoadEdge edge={edge} sourceNode={src} targetNode={tgt} isPath={isInReroute} />
                    {/* Clickable overlay */}
                    {mode === 'block' && (
                      <line
                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke="transparent" strokeWidth="20"
                        className="cursor-pointer"
                        onClick={() => handleEdgeClick(edge.source, edge.target)}
                      />
                    )}
                  </g>
                );
              })}

              {nodes.map(node => (
                <BinNode key={node.id} node={node} size="large"
                  isTSPSelected={node.id === endNode}
                  isDijkstraCurrent={node.id === startNode}
                  onClick={() => handleNodeClick(node.id)} />
              ))}
            </svg>
          </div>
        </div>

        <div className="w-72 shrink-0 glass-panel border-l border-dark-700/30 overflow-y-auto p-3 space-y-3">
          {/* Connectivity Status */}
          <div className={`glass-card p-4 ${connectivityInfo.includes('DISCONNECTED') ? 'glow-red' : 'glow-green'}`}>
            <h3 className="section-header">Connectivity Status</h3>
            <p className={`text-sm font-medium ${connectivityInfo.includes('DISCONNECTED') ? 'text-accent-red' : 'text-accent-green'}`}>
              {connectivityInfo || 'No checks performed yet'}
            </p>
          </div>

          {/* Blocked Roads */}
          <div className="glass-card p-4">
            <h3 className="section-header text-accent-red">Blocked Roads ({edges.filter(e => e.isBlocked).length})</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {edges.filter(e => e.isBlocked).map((e, i) => (
                <div key={i} className="flex justify-between text-xs bg-accent-red/10 rounded px-3 py-1.5">
                  <span className="text-accent-red">Node {e.source} ↔ Node {e.target}</span>
                  <button onClick={() => toggleRoad(e.source, e.target)} className="text-dark-500 hover:text-white">
                    Repair
                  </button>
                </div>
              ))}
              {edges.filter(e => e.isBlocked).length === 0 && (
                <p className="text-xs text-dark-500 text-center py-2">No blocked roads</p>
              )}
            </div>
          </div>

          {/* Reroute Result */}
          {reroutePath.length > 0 && (
            <div className="glass-card p-4 glow-blue">
              <h3 className="section-header text-accent-blue">Rerouted Path</h3>
              <div className="bg-dark-800/40 rounded-lg p-3 text-xs font-mono text-accent-blue">
                {reroutePath.join(' → ')}
              </div>
            </div>
          )}

          <StatsPanel stats={stats} />

          {/* Flow Info */}
          <div className="glass-card p-4">
            <h3 className="section-header">Rerouting Flow</h3>
            <div className="space-y-2 text-xs text-dark-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-green" /> Road Active
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-red" /> Road Blocked
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-blue" /> Rerouted Path
              </div>
              <p className="mt-2">Green → Red → Reroute → New Path</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadFailurePage;
