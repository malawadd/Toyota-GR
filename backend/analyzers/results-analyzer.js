/**
 * Analyze race results data
 * @param {Array<Object>} resultRecords - Array of race result records from parser
 * @returns {Object} Analysis results with winner, total vehicles, gaps, and class breakdown
 */
export function analyzeRaceResults(resultRecords) {
  if (!resultRecords || resultRecords.length === 0) {
    return {
      winner: null,
      totalVehicles: 0,
      gaps: [],
      byClass: new Map()
    };
  }

  // Sort by position to ensure correct order
  const sortedResults = [...resultRecords].sort((a, b) => a.position - b.position);

  // Extract race winner (position 1)
  const winner = sortedResults.find(r => r.position === 1) || null;

  // Count total vehicles
  const totalVehicles = sortedResults.length;

  // Calculate gaps between consecutive positions
  const gaps = [];
  for (let i = 1; i < sortedResults.length; i++) {
    const current = sortedResults[i];
    const previous = sortedResults[i - 1];
    
    gaps.push({
      position: current.position,
      number: current.number,
      gapToPrevious: current.gap_previous,
      gapToFirst: current.gap_first
    });
  }

  // Group results by class
  const byClass = new Map();
  for (const result of sortedResults) {
    const className = result.class || 'Unknown';
    
    if (!byClass.has(className)) {
      byClass.set(className, []);
    }
    
    byClass.get(className).push(result);
  }

  return {
    winner,
    totalVehicles,
    gaps,
    byClass
  };
}
