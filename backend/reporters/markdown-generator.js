/**
 * Create a markdown table from headers and rows
 * @param {Array<string>} headers - Column headers
 * @param {Array<Array<string>>} rows - Table rows (each row is an array of cell values)
 * @returns {string} Markdown formatted table
 */
export function createTable(headers, rows) {
  if (!headers || headers.length === 0) {
    return '';
  }

  // Create header row
  const headerRow = '| ' + headers.join(' | ') + ' |';
  
  // Create separator row
  const separator = '| ' + headers.map(() => '---').join(' | ') + ' |';
  
  // Create data rows
  const dataRows = rows.map(row => {
    return '| ' + row.join(' | ') + ' |';
  });
  
  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * Create a markdown heading
 * @param {string} text - Heading text
 * @param {number} level - Heading level (1-6)
 * @returns {string} Markdown formatted heading
 */
export function createHeading(text, level = 1) {
  if (level < 1 || level > 6) {
    level = 1;
  }
  
  const hashes = '#'.repeat(level);
  return `${hashes} ${text}`;
}

/**
 * Format a number with specified precision
 * @param {number} num - Number to format
 * @param {number} precision - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(num, precision = 2) {
  if (num === null || num === undefined || isNaN(num)) {
    return 'N/A';
  }
  
  return num.toFixed(precision);
}

/**
 * Format lap time from milliseconds to MM:SS.mmm
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
export function formatLapTime(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return 'N/A';
  }
  
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(3);
  
  // Pad seconds to ensure format like "2:08.630" not "2:8.630"
  const paddedSeconds = seconds.padStart(6, '0');
  
  return `${minutes}:${paddedSeconds}`;
}
