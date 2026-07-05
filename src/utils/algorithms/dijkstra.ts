/**
 * Dijkstra's Shortest Path Algorithm
 * Data Structures: Weighted Graph (Adjacency List), Min Heap (Priority Queue)
 * Complexity: O((V + E) log V) with binary heap
 */
import type { Node, Edge, NodeId, AlgorithmStats } from '../../types';

interface DijkstraStep {
  currentNode: NodeId;
  visited: Set<NodeId>;
  distances: Map<NodeId, number>;
  previous: Map<NodeId, NodeId | null>;
  priorityQueue: { id: NodeId; distance: number }[];
  relaxingEdge: { source: NodeId; target: NodeId } | null;
  phase: 'select' | 'relax' | 'done';
}

export interface DijkstraResult {
  path: NodeId[];
  distance: number;
  steps: DijkstraStep[];
  stats: AlgorithmStats;
}

// MinHeap for efficient priority queue
class MinHeap {
  private heap: { id: NodeId; distance: number }[] = [];
  public operations = 0;

  insert(item: { id: NodeId; distance: number }) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
    this.operations++;
  }

  extractMin(): { id: NodeId; distance: number } | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    this.operations++;
    return min;
  }

  decreaseKey(id: NodeId, newDistance: number) {
    const idx = this.heap.findIndex(x => x.id === id);
    if (idx !== -1 && newDistance < this.heap[idx].distance) {
      this.heap[idx].distance = newDistance;
      this.bubbleUp(idx);
      this.operations++;
    }
  }

  get size() { return this.heap.length; }
  get items() { return [...this.heap]; }

  private bubbleUp(idx: number) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].distance <= this.heap[idx].distance) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  private sinkDown(idx: number) {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left < length && this.heap[left].distance < this.heap[smallest].distance) smallest = left;
      if (right < length && this.heap[right].distance < this.heap[smallest].distance) smallest = right;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

export function buildAdjacencyList(
  nodes: Node[],
  edges: Edge[]
): Map<NodeId, { target: NodeId; distance: number; edge: Edge }[]> {
  const adj = new Map<NodeId, { target: NodeId; distance: number; edge: Edge }[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (!e.isBlocked) {
      adj.get(e.source)?.push({ target: e.target, distance: e.distance, edge: e });
      adj.get(e.target)?.push({ target: e.source, distance: e.distance, edge: e });
    }
  });
  return adj;
}

export function dijkstra(
  startNode: NodeId,
  endNode: NodeId,
  nodes: Node[],
  edges: Edge[],
  recordSteps = false
): DijkstraResult {
  const startTime = performance.now();
  const adj = buildAdjacencyList(nodes, edges);
  const distances = new Map<NodeId, number>();
  const previous = new Map<NodeId, NodeId | null>();
  const visited = new Set<NodeId>();
  const steps: DijkstraStep[] = [];
  let nodesExplored = 0;
  let edgesRelaxed = 0;

  const pq = new MinHeap();

  nodes.forEach(n => {
    distances.set(n.id, Infinity);
    previous.set(n.id, null);
  });
  distances.set(startNode, 0);
  pq.insert({ id: startNode, distance: 0 });

  while (pq.size > 0) {
    const current = pq.extractMin()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    nodesExplored++;

    if (recordSteps) {
      steps.push({
        currentNode: current.id,
        visited: new Set(visited),
        distances: new Map(distances),
        previous: new Map(previous),
        priorityQueue: pq.items,
        relaxingEdge: null,
        phase: 'select',
      });
    }

    if (current.id === endNode) break;

    const neighbors = adj.get(current.id) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.target)) continue;

      const alt = distances.get(current.id)! + neighbor.distance;
      if (alt < distances.get(neighbor.target)!) {
        distances.set(neighbor.target, alt);
        previous.set(neighbor.target, current.id);
        pq.insert({ id: neighbor.target, distance: alt });
        edgesRelaxed++;

        if (recordSteps) {
          steps.push({
            currentNode: current.id,
            visited: new Set(visited),
            distances: new Map(distances),
            previous: new Map(previous),
            priorityQueue: pq.items,
            relaxingEdge: { source: current.id, target: neighbor.target },
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
  const memoryUsage = nodes.length * 16 + edges.length * 8 + pq.operations * 4;

  return {
    path,
    distance: distances.get(endNode) || Infinity,
    steps,
    stats: {
      algorithmName: "Dijkstra's Algorithm",
      executionTime,
      theoreticalComplexity: 'O((V + E) log V)',
      memoryUsage,
      nodesExplored,
      edgesRelaxed,
      heapOperations: pq.operations,
      dpStates: 0,
      prunedNodes: 0,
      totalCost: distances.get(endNode) || Infinity,
    },
  };
}

// Build distance matrix using Dijkstra from each node of interest
export function buildDistanceMatrix(
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
        const { distance } = dijkstra(start, end, nodes, edges);
        matrix.get(start)!.set(end, distance);
      }
    }
  }
  return matrix;
}
