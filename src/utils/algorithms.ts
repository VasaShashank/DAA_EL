/**
 * Legacy algorithms - maintained for backward compatibility.
 * New code should import from './algorithms/index.ts'
 */
import type { Node, Edge, NodeId } from '../types';
import { dijkstra, buildDistanceMatrix as buildDistMatrix } from './algorithms/dijkstra';
import { buildTrafficAwareDistanceMatrix as buildTrafficDistMatrix } from './algorithms/trafficDijkstra';
import { nearestNeighborTSP, naiveTSP } from './algorithms/branchAndBound';

export function calculatePriority(node: Node): number {
  if (node.isDepot) return 0;
  return (
    node.fillLevel * 0.4 +
    (node.complaintCount || 0) * 5 +
    (node.nearHospital ? 20 : 0) +
    (node.nearSchool ? 15 : 0) +
    (node.smellScore || 0) * 3 +
    node.populationDensity * 0.1
  );
}

export function isPredictedOverflow(node: Node): boolean {
  if (node.isDepot) return false;
  const predictedFill = node.fillLevel + node.growthRate;
  return predictedFill >= 80;
}

export function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<NodeId, { target: NodeId; distance: number }[]> {
  const adj = new Map<NodeId, { target: NodeId; distance: number }[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (!e.isBlocked) {
      adj.get(e.source)?.push({ target: e.target, distance: e.distance });
      adj.get(e.target)?.push({ target: e.source, distance: e.distance });
    }
  });
  return adj;
}

export function getShortestPath(
  startNode: NodeId,
  endNode: NodeId,
  nodes: Node[],
  edges: Edge[]
): { path: NodeId[]; distance: number } {
  const result = dijkstra(startNode, endNode, nodes, edges, false);
  return { path: result.path, distance: result.distance };
}

export function buildDistanceMatrix(
  nodesOfInterest: NodeId[],
  nodes: Node[],
  edges: Edge[],
  trafficAware = false
): Map<NodeId, Map<NodeId, number>> {
  if (trafficAware) {
    return buildTrafficDistMatrix(nodesOfInterest, nodes, edges);
  }
  return buildDistMatrix(nodesOfInterest, nodes, edges);
}

export function solveTSPNearestNeighbor(
  depot: NodeId,
  binsToVisit: NodeId[],
  distanceMatrix: Map<NodeId, Map<NodeId, number>>
): { route: NodeId[]; cost: number } {
  const result = nearestNeighborTSP(depot, binsToVisit, distanceMatrix);
  return { route: result.route, cost: result.cost };
}

export function solveTSPNaive(
  depot: NodeId,
  binsToVisit: NodeId[],
  distanceMatrix: Map<NodeId, Map<NodeId, number>>
): number {
  return naiveTSP(depot, binsToVisit, distanceMatrix);
}
