export type NodeId = number;

export interface Node {
  id: NodeId;
  x: number;
  y: number;
  isDepot: boolean;

  // Bin properties
  fillLevel: number; // 0-100
  growthRate: number; // % increase per tick
  populationDensity: number; // 0-100, affects priority
  wasteWeight: number; // Current weight of waste in kg

  // Extended properties for DAA
  complaintCount: number; // 0-10
  nearHospital: boolean;
  nearSchool: boolean;
  smellScore: number; // 0-10
  priorityScore: number; // computed
}

export interface Edge {
  source: NodeId;
  target: NodeId;
  distance: number;

  // Traffic-aware properties
  trafficWeight: number; // 0-10 (0=no traffic, 10=gridlock)
  roadCondition: number; // 0-5 (0=perfect, 5=terrible)
  constructionDelay: number; // 0-10 (0=none, 10=major)
  isBlocked: boolean; // Road failure
}

export interface Truck {
  id: string;
  capacity: number;
  currentLoad: number;
  currentNode: NodeId | null;
  targetNode: NodeId | null;
  path: NodeId[]; // Path of nodes to travel
  route: NodeId[]; // High level route of bins to visit
  status: 'IDLE' | 'EN_ROUTE' | 'COLLECTING' | 'RETURNING' | 'UNLOADING';
  progress: number; // Progress along the current edge (0 to 1)
  totalDistanceTraveled: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'INFO' | 'WARNING' | 'EMERGENCY' | 'SUCCESS';
}

export interface AlgorithmStats {
  algorithmName: string;
  executionTime: number; // ms
  theoreticalComplexity: string; // e.g. "O(V² log V)"
  memoryUsage: number; // approximate bytes
  nodesExplored: number;
  edgesRelaxed: number;
  heapOperations: number;
  dpStates: number;
  prunedNodes: number;
  totalCost: number;
}

export interface KnapsackItem {
  binId: NodeId;
  weight: number;
  priority: number;
  fillLevel: number;
}

export interface KnapsackResult {
  selectedItems: KnapsackItem[];
  skippedItems: KnapsackItem[];
  totalWeight: number;
  totalPriority: number;
  remainingCapacity: number;
  dpTable: number[][];
  stats: AlgorithmStats;
}

export interface HeapStep {
  type: 'insert' | 'delete' | 'swap' | 'heapify' | 'extract';
  array: number[];
  indices: number[]; // indices involved in operation
  description: string;
}

export interface BranchAndBoundNode {
  id: number;
  level: number;
  path: NodeId[];
  cost: number;
  lowerBound: number;
  isPruned: boolean;
  isOptimal: boolean;
  children: number[];
  parentId: number | null;
}

export interface BranchAndBoundResult {
  optimalRoute: NodeId[];
  optimalCost: number;
  stateTree: BranchAndBoundNode[];
  statesGenerated: number;
  statesPruned: number;
  stats: AlgorithmStats;
}

export interface DecisionTreeNode {
  id: string;
  condition: string;
  description: string;
  yesChild: string | null;
  noChild: string | null;
  result: string | null; // Algorithm name if leaf
  resultReason: string | null;
  resultComplexity: string | null;
}

export interface DecisionTreeResult {
  chosenAlgorithm: string;
  reason: string;
  expectedComplexity: string;
  traversalPath: string[];
  decisions: { nodeId: string; condition: string; result: boolean; reason: string }[];
}

export interface CarbonMetrics {
  fuelConsumption: number; // liters
  co2Emissions: number; // kg
  fuelConsumptionRate: number; // L/km
  emissionFactor: number; // kg CO2/L
}

export interface RouteComparison {
  label: string;
  distance: number;
  fuel: number;
  carbon: number;
  time: number;
  route: NodeId[];
}

export interface Metrics {
  totalBins: number;
  urgentBins: number;
  predictedOverflows: number;
  totalWasteCollected: number;
  totalDistanceTraveled: number;
  naiveDistance: number;
  totalFuelSaved: number;
  truckUtilization: number;
}

// Dijkstra visualization state
export interface DijkstraVisualizerState {
  startNode: NodeId | null;
  endNode: NodeId | null;
  currentNode: NodeId | null;
  visited: Set<NodeId>;
  priorityQueue: { id: NodeId; distance: number }[];
  distances: Record<NodeId, number>;
  previous: Record<NodeId, NodeId | null>;
  relaxingEdges: { source: NodeId; target: NodeId }[];
  finalPath: NodeId[];
  isComplete: boolean;
}

// Algorithm execution records for performance dashboard
export interface AlgorithmRun {
  id: string;
  timestamp: Date;
  stats: AlgorithmStats;
}

export interface SimulationState {
  nodes: Node[];
  edges: Edge[];
  trucks: Truck[];
  logs: EventLogEntry[];
  metrics: Metrics;
  algorithmRuns: AlgorithmRun[];

  isRunning: boolean;
  speed: number;
  tickCount: number;
  binCount: number;

  // Visualization Modes
  activeMode: 'MAIN' | 'DIJKSTRA' | 'TSP';

  // Dijkstra Visualization State
  dijkstraState: DijkstraVisualizerState | null;

  // TSP Visualization State
  tspState: {
    selectedBins: NodeId[];
    currentBestRoute: NodeId[];
    currentCost: number;
    evaluatingRoute: NodeId[] | null;
    isFinished: boolean;
  } | null;
}
