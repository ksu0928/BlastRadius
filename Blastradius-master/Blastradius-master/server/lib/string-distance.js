// Shared string distance and similarity utilities

/**
 * Calculate Levenshtein edit distance between two strings
 * Time complexity: O(m*n), Space: O(m*n)
 */
export function editDistance(a, b) {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,      // deletion
        matrix[j - 1][i] + 1,      // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Calculate Damerau-Levenshtein distance (includes transpositions)
 */
export function damerauLevenshtein(a, b) {
  const len1 = a.length;
  const len2 = b.length;
  const maxDist = len1 + len2;
  
  const H = {};
  H[-1] = maxDist;
  
  for (let i = 0; i <= len1; i++) {
    H[i * (len2 + 2)] = maxDist;
    H[i * (len2 + 2) + 1] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    H[j] = maxDist;
    H[j + 1] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    let DB = 0;
    for (let j = 1; j <= len2; j++) {
      const k = H[a[i - 1]] || 0;
      const l = DB;
      let cost = 1;
      
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
        DB = j;
      }
      
      const key = i * (len2 + 2) + j + 1;
      H[key] = Math.min(
        H[(i - 1) * (len2 + 2) + j + 1] + 1, // deletion
        H[i * (len2 + 2) + j] + 1,           // insertion
        H[(i - 1) * (len2 + 2) + j] + cost,  // substitution
        H[(k - 1) * (len2 + 2) + l] + (i - k - 1) + 1 + (j - l - 1) // transposition
      );
    }
    
    H[a[i - 1]] = i;
  }
  
  return H[len1 * (len2 + 2) + len2 + 1];
}

/**
 * Calculate similarity ratio (0-1, where 1 is identical)
 */
export function similarityRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

/**
 * Get common prefix between two strings
 */
export function commonPrefix(a, b) {
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
  return a.substring(0, i);
}

/**
 * Get common suffix between two strings
 */
export function commonSuffix(a, b) {
  let i = 0;
  while (i < Math.min(a.length, b.length) && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return a.substring(a.length - i);
}
