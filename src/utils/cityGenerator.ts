import type { Node, Edge } from '../types';

export function generateRandomCity(
  numNodes: number,
  width: number,
  height: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const padding = 80;

  // Create depot (Node 0) at center
  nodes.push({
    id: 0,
    x: width / 2,
    y: height / 2,
    isDepot: true,
    fillLevel: 0,
    growthRate: 0,
    populationDensity: 0,
    wasteWeight: 0,
    complaintCount: 0,
    nearHospital: false,
    nearSchool: false,
    smellScore: 0,
    priorityScore: 0,
  });

  // Create random bins spread in a circle/grid pattern for better distribution
  for (let i = 1; i < numNodes; i++) {
    const nearHospital = Math.random() < 0.15;
    const nearSchool = Math.random() < 0.2;
    const complaintCount = Math.floor(Math.random() * 8);
    const smellScore = Math.floor(Math.random() * 8);
    const fillLevel = Math.floor(Math.random() * 40);

    nodes.push({
      id: i,
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding),
      isDepot: false,
      fillLevel,
      growthRate: Math.max(1, Math.floor(Math.random() * 10)),
      populationDensity: Math.floor(Math.random() * 100),
      wasteWeight: fillLevel * 2,
      complaintCount,
      nearHospital,
      nearSchool,
      smellScore,
      priorityScore: 0, // Will be calculated
    });
  }

  // Generate fully connected graph
  const edges: Edge[] = [];
  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 1; j < numNodes; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      edges.push({
        source: i,
        target: j,
        distance: Math.max(1, Math.floor(dist / 10)),
        trafficWeight: Math.floor(Math.random() * 6),
        roadCondition: Math.floor(Math.random() * 3),
        constructionDelay: Math.random() < 0.1 ? Math.floor(Math.random() * 5) : 0,
        isBlocked: false,
      });
    }
  }

  return { nodes, edges };
}
