/**
 * Graph Traversal Algorithms: BFS and DFS
 * Used for connectivity checking after road failures
 * Data Structures: Graph, Queue (BFS), Stack (DFS), Adjacency List
 * Complexity: O(V + E)
 */
import type { Node, Edge, NodeId, AlgorithmStats } from '../../types';

export interface TraversalStep {
  currentNode: NodeId;
  visited: Set<NodeId>;
  frontier: NodeId[]; // Queue for BFS, Stack for DFS
  phase: 'visit' | 'explore' | 'done';
}

export interface TraversalResult {
  visitOrder: NodeId[];
  steps: TraversalStep[];
  isConnected: boolean;
  components: NodeId[][];
  stats: AlgorithmStats;
}

function buildAdj(nodes: Node[], edges: Edge[]): Map<NodeId, NodeId[]> {
  const adj = new Map<NodeId, NodeId[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (!e.isBlocked) {
      adj.get(e.source)?.push(e.target);
      adj.get(e.target)?.push(e.source);
    }
  });
  return adj;
}

export function bfs(
  startNode: NodeId,
  nodes: Node[],
  edges: Edge[],
  recordSteps = false
): TraversalResult {
  const startTime = performance.now();
  const adj = buildAdj(nodes, edges);
  const visited = new Set<NodeId>();
  const visitOrder: NodeId[] = [];
  const steps: TraversalStep[] = [];
  const queue: NodeId[] = [startNode];
  visited.add(startNode);

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitOrder.push(current);

    if (recordSteps) {
      steps.push({
        currentNode: current,
        visited: new Set(visited),
        frontier: [...queue],
        phase: 'visit',
      });
    }

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    if (recordSteps) {
      steps.push({
        currentNode: current,
        visited: new Set(visited),
        frontier: [...queue],
        phase: 'explore',
      });
    }
  }

  // Check connectivity — find all components
  const allVisited = new Set<NodeId>();
  const components: NodeId[][] = [];

  for (const node of nodes) {
    if (allVisited.has(node.id)) continue;
    const component: NodeId[] = [];
    const q: NodeId[] = [node.id];
    allVisited.add(node.id);
    while (q.length > 0) {
      const c = q.shift()!;
      component.push(c);
      for (const neighbor of (adj.get(c) || [])) {
        if (!allVisited.has(neighbor)) {
          allVisited.add(neighbor);
          q.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  if (recordSteps) {
    steps.push({
      currentNode: startNode,
      visited: new Set(visited),
      frontier: [],
      phase: 'done',
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    visitOrder,
    steps,
    isConnected: components.length === 1,
    components,
    stats: {
      algorithmName: 'Breadth-First Search',
      executionTime,
      theoreticalComplexity: 'O(V + E)',
      memoryUsage: nodes.length * 8 + edges.length * 4,
      nodesExplored: visitOrder.length,
      edgesRelaxed: 0,
      heapOperations: 0,
      dpStates: 0,
      prunedNodes: 0,
      totalCost: 0,
    },
  };
}

export function dfs(
  startNode: NodeId,
  nodes: Node[],
  edges: Edge[],
  recordSteps = false
): TraversalResult {
  const startTime = performance.now();
  const adj = buildAdj(nodes, edges);
  const visited = new Set<NodeId>();
  const visitOrder: NodeId[] = [];
  const steps: TraversalStep[] = [];
  const stack: NodeId[] = [startNode];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    visitOrder.push(current);

    if (recordSteps) {
      steps.push({
        currentNode: current,
        visited: new Set(visited),
        frontier: [...stack],
        phase: 'visit',
      });
    }

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors.reverse()) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    }

    if (recordSteps) {
      steps.push({
        currentNode: current,
        visited: new Set(visited),
        frontier: [...stack],
        phase: 'explore',
      });
    }
  }

  if (recordSteps) {
    steps.push({
      currentNode: startNode,
      visited: new Set(visited),
      frontier: [],
      phase: 'done',
    });
  }

  const executionTime = performance.now() - startTime;

  return {
    visitOrder,
    steps,
    isConnected: visited.size === nodes.length,
    components: [visitOrder],
    stats: {
      algorithmName: 'Depth-First Search',
      executionTime,
      theoreticalComplexity: 'O(V + E)',
      memoryUsage: nodes.length * 8 + edges.length * 4,
      nodesExplored: visitOrder.length,
      edgesRelaxed: 0,
      heapOperations: 0,
      dpStates: 0,
      prunedNodes: 0,
      totalCost: 0,
    },
  };
}
