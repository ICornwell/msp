import {satisfies, gt} from 'semver'

export type Matcher = string | RegExp | ((value: string) => boolean);

export function isMatch(input: string, match: Matcher): boolean {
  if (typeof match === 'string') {
    return match === '*' || input === match;
  }
  if (match instanceof RegExp) {
    return match.test(input);
  }
  if (typeof match === 'function') {
    return match(input);
  }
  return false;
}

export function isVersionMatch(input: string, match: string): boolean {

  return satisfies(input, match as string) || satisfies(match, input);
}

export function highestVersionMatches<T>(candidates: T[], requestedVersionRange: string, unqiueNameExtractor: (x: T)=>string, versionExtractor: (x: T)=>string): T[] {
  // Group candidates by unique name
  const groupedByName = new Map<string, T[]>();
  
  for (const candidate of candidates) {
    const name = unqiueNameExtractor(candidate);
    if (!groupedByName.has(name)) {
      groupedByName.set(name, []);
    }
    groupedByName.get(name)!.push(candidate);
  }
  
  const results: T[] = [];
  
  // For each name group, find the highest version that satisfies the range
  for (const [name, groupCandidates] of groupedByName.entries()) {
    let highestMatch: T | null = null;
    let highestVersion: string | null = null;
    
    for (const candidate of groupCandidates) {
      const version = versionExtractor(candidate);
      
      // Check if this version satisfies the requested range
      try {
        if (satisfies(version, requestedVersionRange)) {
          // If this is the first match or higher than current highest
          if (highestVersion === null || gt(version, highestVersion)) {
            highestMatch = candidate;
            highestVersion = version;
          }
        }
      } catch (error) {
        // Invalid version format - skip this candidate
        continue;
      }
    }
    
    // Add the highest match for this name (if any)
    if (highestMatch !== null) {
      results.push(highestMatch);
    }
  }
  
  return results;
}

export function bestVersionMatch<T>(candidates: T[], requestedVersion: string, uniqueNameExtractor: (x: T)=>string, versionExtractor: (x: T)=>string, rangeExtractor: (x: T)=>string): T[] {
  // Group candidates by unique name
  const groupedByName = new Map<string, T[]>();
  
  for (const candidate of candidates) {
    const name = uniqueNameExtractor(candidate);
    if (!groupedByName.has(name)) {
      groupedByName.set(name, []);
    }
    groupedByName.get(name)!.push(candidate);
  }
  
  const results: T[] = [];
  
  // For each name group, find the candidate with highest version whose range includes the requested version
  for (const [_name, groupCandidates] of groupedByName.entries()) {
    let bestMatch: T | null = null;
    let bestMatchVersion: string | null = null;
    
    for (const candidate of groupCandidates) {
      const candidateVersion = versionExtractor(candidate);
      const candidateRange = rangeExtractor(candidate);
      
      // Check if the requested version satisfies this candidate's range
      try {
        if (satisfies(requestedVersion, candidateRange)) {
          // If this is the first match or has a higher version than current best
          if (bestMatchVersion === null || gt(candidateVersion, bestMatchVersion)) {
            bestMatch = candidate;
            bestMatchVersion = candidateVersion;
          }
        }
      } catch (error) {
        // Invalid version or range format - skip this candidate
        continue;
      }
    }
    
    // Add the best match for this name (if any)
    if (bestMatch !== null) {
      results.push(bestMatch);
    }
  }
  
  return results;
}