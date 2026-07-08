/**
 * Decision Tree Based Algorithm Selector
 *
 * The selector separates three jobs:
 * 1. Choose which bins can fit in the truck.
 * 2. Choose the order of selected bins when there are multiple stops.
 * 3. Choose normal or traffic-aware shortest paths between consecutive stops.
 */
import type { DecisionTreeNode, DecisionTreeResult } from '../../types';

const decisionTreeNodes: Map<string, DecisionTreeNode> = new Map();

function addNode(node: DecisionTreeNode) {
  decisionTreeNodes.set(node.id, node);
}

addNode({
  id: 'root',
  condition: 'Demand > Capacity?',
  description: 'Check whether selected bin demand exceeds truck capacity',
  yesChild: 'knapsack-selection',
  noChild: 'check-destinations',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'knapsack-selection',
  condition: 'Run 0/1 Knapsack first',
  description: 'Truck capacity exceeded; select the best subset before routing',
  yesChild: 'check-destinations',
  noChild: null,
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'check-destinations',
  condition: 'Single Destination?',
  description: 'Check whether only one selected bin must be visited',
  yesChild: 'single-traffic-check',
  noChild: 'check-count',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'single-traffic-check',
  condition: 'High Traffic?',
  description: 'Single-stop routing still only needs a shortest path',
  yesChild: 'traffic-dijkstra-single',
  noChild: 'dijkstra',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'dijkstra',
  condition: '',
  description: 'Single destination with normal road weights',
  yesChild: null,
  noChild: null,
  result: "Dijkstra's Algorithm",
  resultReason: 'Only one destination. Shortest path routing is sufficient.',
  resultComplexity: 'O((V + E) log V)',
});

addNode({
  id: 'traffic-dijkstra-single',
  condition: '',
  description: 'Single destination with traffic-adjusted road weights',
  yesChild: null,
  noChild: null,
  result: 'Traffic-Aware Dijkstra',
  resultReason: 'Only one destination, but traffic is high. Use traffic-adjusted edge costs.',
  resultComplexity: 'O((V + E) log V)',
});

addNode({
  id: 'check-count',
  condition: 'Destinations <= 8?',
  description: 'Check whether exact TSP is feasible',
  yesChild: 'branch-bound',
  noChild: 'nearest-neighbor',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'branch-bound',
  condition: '',
  description: 'Use exact Branch & Bound TSP for the selected bin order',
  yesChild: 'multi-traffic-check-exact',
  noChild: null,
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'multi-traffic-check-exact',
  condition: 'High Traffic?',
  description: 'Traffic changes the path between TSP stops, not the need for TSP ordering',
  yesChild: 'bb-tsp-traffic',
  noChild: 'bb-tsp-normal',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'bb-tsp-normal',
  condition: '',
  description: 'Small route with exact visit order and normal shortest paths',
  yesChild: null,
  noChild: null,
  result: 'Branch & Bound TSP + Dijkstra',
  resultReason: 'Destination count <= 8. TSP chooses the stop order; Dijkstra finds each road segment.',
  resultComplexity: 'O(n!) + O(k(V + E) log V)',
});

addNode({
  id: 'bb-tsp-traffic',
  condition: '',
  description: 'Small route with exact visit order and traffic-aware shortest paths',
  yesChild: null,
  noChild: null,
  result: 'Branch & Bound TSP + Traffic-Aware Dijkstra',
  resultReason: 'Destination count <= 8. TSP chooses the stop order; high traffic changes segment costs.',
  resultComplexity: 'O(n!) + O(k(V + E) log V)',
});

addNode({
  id: 'nearest-neighbor',
  condition: '',
  description: 'Use Greedy Nearest Neighbor TSP for the selected bin order',
  yesChild: 'multi-traffic-check-greedy',
  noChild: null,
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'multi-traffic-check-greedy',
  condition: 'High Traffic?',
  description: 'Traffic changes the path between greedy TSP stops, not the need for TSP ordering',
  yesChild: 'nn-tsp-traffic',
  noChild: 'nn-tsp-normal',
  result: null,
  resultReason: null,
  resultComplexity: null,
});

addNode({
  id: 'nn-tsp-normal',
  condition: '',
  description: 'Large route with greedy visit order and normal shortest paths',
  yesChild: null,
  noChild: null,
  result: 'Greedy Nearest Neighbor TSP + Dijkstra',
  resultReason: 'Destination count > 8. Greedy TSP keeps routing tractable; Dijkstra finds each road segment.',
  resultComplexity: 'O(n^2) + O(k(V + E) log V)',
});

addNode({
  id: 'nn-tsp-traffic',
  condition: '',
  description: 'Large route with greedy visit order and traffic-aware shortest paths',
  yesChild: null,
  noChild: null,
  result: 'Greedy Nearest Neighbor TSP + Traffic-Aware Dijkstra',
  resultReason: 'Destination count > 8. Greedy TSP keeps routing tractable; high traffic changes segment costs.',
  resultComplexity: 'O(n^2) + O(k(V + E) log V)',
});

export interface DecisionContext {
  truckFull: boolean;
  destinationCount: number;
  hasHighTraffic: boolean;
  hasRoadFailures: boolean;
}

export function traverseDecisionTree(context: DecisionContext): DecisionTreeResult {
  const traversalPath: string[] = [];
  const decisions: DecisionTreeResult['decisions'] = [];
  let currentId = 'root';
  let chosenAlgorithm = 'Dijkstra';
  let reason = '';
  let complexity = '';

  while (currentId) {
    const node = decisionTreeNodes.get(currentId);
    if (!node) break;

    traversalPath.push(currentId);

    if (node.result) {
      chosenAlgorithm = node.result;
      reason = node.resultReason || '';
      complexity = node.resultComplexity || '';
      break;
    }

    if (!node.condition && node.yesChild) {
      decisions.push({
        nodeId: currentId,
        condition: node.description,
        result: true,
        reason: 'Step selected',
      });
      currentId = node.yesChild;
      continue;
    }

    const condResult = evaluateCondition(node.condition, context);
    decisions.push({
      nodeId: currentId,
      condition: node.condition,
      result: condResult,
      reason: condResult ? `Yes: ${node.description}` : 'No: Moving to next check',
    });

    currentId = condResult ? (node.yesChild || '') : (node.noChild || '');
  }

  return { chosenAlgorithm, reason, expectedComplexity: complexity, traversalPath, decisions };
}

function evaluateCondition(condition: string, context: DecisionContext): boolean {
  switch (condition) {
    case 'Demand > Capacity?':
      return context.truckFull;
    case 'Run 0/1 Knapsack first':
      return true;
    case 'Single Destination?':
      return context.destinationCount === 1;
    case 'Destinations <= 8?':
      return context.destinationCount <= 8;
    case 'High Traffic?':
      return context.hasHighTraffic;
    default:
      return false;
  }
}

export function getDecisionTreeNodes(): DecisionTreeNode[] {
  return Array.from(decisionTreeNodes.values());
}

export function getDecisionTreeNodeById(id: string): DecisionTreeNode | undefined {
  return decisionTreeNodes.get(id);
}
