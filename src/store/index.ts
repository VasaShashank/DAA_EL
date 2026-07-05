import { create } from 'zustand';
import type { SimulationState, Truck, EventLogEntry, Metrics, NodeId, AlgorithmRun } from '../types';
import { generateRandomCity } from '../utils/cityGenerator';

interface SimulationStore extends SimulationState {
  generateCity: (numNodes?: number) => void;
  toggleSimulation: () => void;
  setSpeed: (speed: number) => void;
  tick: () => void;
  addLog: (message: string, type: EventLogEntry['type']) => void;
  setMode: (mode: SimulationState['activeMode']) => void;
  triggerEmergency: (nodeId: NodeId) => void;
  dispatchTruck: (route: NodeId[]) => void;
  setBinCount: (count: number) => void;
  toggleRoad: (source: NodeId, target: NodeId) => void;
  addAlgorithmRun: (run: AlgorithmRun) => void;
  updateTraffic: () => void;
}

const initialMetrics: Metrics = {
  totalBins: 0,
  urgentBins: 0,
  predictedOverflows: 0,
  totalWasteCollected: 0,
  totalDistanceTraveled: 0,
  naiveDistance: 0,
  totalFuelSaved: 0,
  truckUtilization: 0,
};

const TRUCK_CAPACITY = 1000;

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  nodes: [],
  edges: [],
  trucks: [],
  logs: [],
  metrics: initialMetrics,
  algorithmRuns: [],

  isRunning: false,
  speed: 1,
  tickCount: 0,
  binCount: 10,

  activeMode: 'MAIN',
  dijkstraState: null,
  tspState: null,

  setBinCount: (count: number) => set({ binCount: Math.max(5, Math.min(25, count)) }),

  generateCity: (numNodes?: number) => {
    const count = numNodes || get().binCount;
    const { nodes, edges } = generateRandomCity(count, 1200, 900);

    const trucks: Truck[] = Array.from({ length: 3 }, (_, i) => ({
      id: `truck-${i + 1}`,
      capacity: TRUCK_CAPACITY,
      currentLoad: 0,
      currentNode: 0,
      targetNode: null,
      path: [],
      route: [],
      status: 'IDLE',
      progress: 0,
      totalDistanceTraveled: 0,
    }));

    set({
      nodes,
      edges,
      trucks,
      logs: [{
        id: Math.random().toString(),
        timestamp: new Date(),
        message: `City generated with ${count} nodes (fully connected graph: ${edges.length} edges).`,
        type: 'INFO',
      }],
      metrics: { ...initialMetrics, totalBins: nodes.length - 1 },
      tickCount: 0,
      isRunning: false,
      algorithmRuns: [],
    });
  },

  toggleSimulation: () => set(state => ({ isRunning: !state.isRunning })),
  setSpeed: (speed) => set({ speed }),

  addLog: (message, type) => {
    set(state => ({
      logs: [{
        id: Math.random().toString(),
        timestamp: new Date(),
        message,
        type,
      }, ...state.logs].slice(0, 50),
    }));
  },

  setMode: (mode) => set({ activeMode: mode }),

  triggerEmergency: (nodeId) => {
    set(state => {
      const newNodes = state.nodes.map(n =>
        n.id === nodeId ? { ...n, fillLevel: 100, wasteWeight: 200 } : n
      );
      return { nodes: newNodes };
    });
    get().addLog(`Emergency at Bin ${nodeId}! Bin is full.`, 'EMERGENCY');
  },

  dispatchTruck: (route) => {
    set(state => {
      const idleTrucks = state.trucks.filter(t => t.status === 'IDLE');
      if (idleTrucks.length === 0) return state;

      const truck = idleTrucks[0];
      const updatedTrucks = state.trucks.map(t => {
        if (t.id === truck.id) {
          return { ...t, route, status: 'EN_ROUTE' as const };
        }
        return t;
      });

      return { trucks: updatedTrucks };
    });
  },

  toggleRoad: (source: NodeId, target: NodeId) => {
    set(state => {
      const newEdges = state.edges.map(e => {
        if (
          (e.source === source && e.target === target) ||
          (e.source === target && e.target === source)
        ) {
          return { ...e, isBlocked: !e.isBlocked };
        }
        return e;
      });
      return { edges: newEdges };
    });
    const edge = get().edges.find(e =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
    );
    if (edge) {
      get().addLog(
        `Road ${source}↔${target} ${edge.isBlocked ? 'repaired' : 'blocked'}!`,
        edge.isBlocked ? 'SUCCESS' : 'WARNING'
      );
    }
  },

  addAlgorithmRun: (run: AlgorithmRun) => {
    set(state => ({
      algorithmRuns: [run, ...state.algorithmRuns].slice(0, 100),
    }));
  },

  updateTraffic: () => {
    set(state => ({
      edges: state.edges.map(e => ({
        ...e,
        trafficWeight: Math.max(0, Math.min(10,
          e.trafficWeight + (Math.random() - 0.5) * 2
        )),
      })),
    }));
  },

  tick: () => {
    const state = get();
    if (!state.isRunning) return;

    set(state => {
      let urgentCount = 0;
      let predictedCount = 0;

      const newNodes = state.nodes.map(node => {
        if (node.isDepot) return node;
        const newFill = Math.min(100, node.fillLevel + node.growthRate * 0.1 * state.speed);
        const predictedFill = newFill + node.growthRate;
        if (newFill >= 80) urgentCount++;
        if (predictedFill >= 80) predictedCount++;
        return {
          ...node,
          fillLevel: newFill,
          wasteWeight: newFill * 2,
        };
      });

      return {
        tickCount: state.tickCount + 1,
        nodes: newNodes,
        metrics: {
          ...state.metrics,
          urgentBins: urgentCount,
          predictedOverflows: predictedCount,
        },
      };
    });
  },
}));
