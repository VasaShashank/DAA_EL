/**
 * Traffic-Aware Dynamic Dijkstra
 * Edge Cost = Distance + TrafficWeight + RoadConditionPenalty + ConstructionDelay
 * Data Structures: Weighted Graph, Min Heap, Adjacency List, Priority Queue
 * Complexity: O((V + E) log V)
 */
import type { Node, Edge, NodeId, AlgorithmStats } from '../../types';

interface TrafficDijkstraStep {
  currentNode: NodeId;
  visited: Set<NodeId>;
  distances: Map<NodeId, number>;
  previous: Map<NodeId, NodeId | null>;
  priorityQueue: { id: NodeId; distance: number }[];
  relaxingEdge: { source: NodeId; target: NodeId; cost: number } | null;
  phase: 'select' | 'relax' | 'done';
}

export interface TrafficDijkstraResult {
  path: NodeId[];
  totalCost: number;
  steps: TrafficDijkstraStep[];
  stats: AlgorithmStats;
}

function computeEdgeCost(edge: Edge): number {
  if (edge.isBlocked) return Infinity;
  return edge.distance + edge.trafficWeight * 2 + edge.roadCondition * 3 + edge.constructionDelay * 4;
}

export function trafficAwareDijkstra(
  startNode: NodeId,
  endNode: NodeId,
  nodes: Node[],
  edges: Edge[],
  recordSteps = false
): TrafficDijkstraResult {
  const startTime = performance.now();

  // Build adjacency list with traffic-aware costs
  const adj = new Map<NodeId, { target: NodeId; cost: number }[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (!e.isBlocked) {
      const cost = computeEdgeCost(e);
      adj.get(e.source)?.push({ target: e.target, cost });
      adj.get(e.target)?.push({ target: e.source, cost });
    }
  });

  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();
  const visited = new Set<NodeId>();
  const steps: TrafficDijkstraStep[] = [];
  let nodesExplored = 0;
  let edgesRelaxed = 0;
  let heapOps = 0;

  // Simple priority queue (array-based for step visibility)
  const pq: { id: NodeId; distance: number }[] = [];

  nodes.forEach(n => {
    distances.set(n.id, Infinity);
    previous.set(n.id, null);
  });
  distances.set(startNode, 0);
  pq.push({ id: startNode, distance: 0 });

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.distance - b.distance);
    const current = pq.shift()!;
    heapOps++;

    if (visited.has(current.id)) continue;
    visited.add(current.id);
    nodesExplored++;

    if (recordSteps) {
      steps.push({
        currentNode: current.id,
        visited: new Set(visited),
        distances: new Map(distances),
        previous: new Map(previous),
        priorityQueue: [...pq],
        relaxingEdge: null,
        phase: 'select',
      });
    }

    if (current.id === endNode) break;

    const neighbors = adj.get(current.id) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.target)) continue;

      const alt = distances.get(current.id)! + neighbor.cost;
      if (alt < distances.get(neighbor.target)!) {
        distances.set(neighbor.target, alt);
        previous.set(neighbor.target, current.id);
        pq.push({ id: neighbor.target, distance: alt });
        edgesRelaxed++;
        heapOps++;

        if (recordSteps) {
          steps.push({
            currentNode: current.id,
            visited: new Set(visited),
            distances: new Map(distances),
            previous: new Map(previous),
            priorityQueue: [...pq],
            relaxingEdge: { source: current.id, target: neighbor.target, cost: neighbor.cost },
            phase: 'relax',
          });
        }
      }
    }
  }

  // Reconstruct path
  const path: NodeId[] = [];
  let curr: NodeId | null = endNode;
  if (previous.get(curr) !== null || curr === startNode) {
    while (curr !== null) {
      path.unshift(curr);
      curr = previous.get(curr)!;
    }
  }

  if (recordSteps) {
    steps.push({
      currentNode: endNode,
      visited: new Set(visited),
      distances: new Map(distances),
      previous: new Map(previous),
      priorityQueue: [],
      relaxingEdge: null,
      phase: 'done',
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    path,
    totalCost: distances.get(endNode) || Infinity,
    steps,
    stats: {
      algorithmName: 'Traffic-Aware Dijkstra',
      executionTime,
      theoreticalComplexity: 'O((V + E) log V)',
      memoryUsage: nodes.length * 20 + edges.length * 12,
      nodesExplored,
      edgesRelaxed,
      heapOperations: heapOps,
      dpStates: 0,
      prunedNodes: 0,
      totalCost: distances.get(endNode) || Infinity,
    },
  };
}

export function buildTrafficAwareDistanceMatrix(
  nodesOfInterest: NodeId[],
  nodes: Node[],
  edges: Edge[]
): Map<NodeId, Map<NodeId, number>> {
  const matrix = new Map<NodeId, Map<NodeId, number>>();

  for (const start of nodesOfInterest) {
    matrix.set(start, new Map());
    for (const end of nodesOfInterest) {
      if (start === end) {
        matrix.get(start)!.set(end, 0);
      } else {
        const { totalCost } = trafficAwareDijkstra(start, end, nodes, edges);
        matrix.get(start)!.set(end, totalCost);
      }
    }
  }

  return matrix;
}
