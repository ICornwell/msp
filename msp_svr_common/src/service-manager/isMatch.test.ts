import { describe, it, expect } from 'vitest';
import { highestVersionMatches, bestVersionMatch } from './isMatch.js';

interface TestPackage {
  name: string;
  version: string;
  id: string; // To help identify in tests
}

describe('highestVersionMatches', () => {
  const nameExtractor = (pkg: TestPackage) => pkg.name;
  const versionExtractor = (pkg: TestPackage) => pkg.version;

  it('should return the highest version that matches the range for a single package name', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.2.0', id: 'a2' },
      { name: 'packageA', version: '1.5.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a3');
    expect(results[0].version).toBe('1.5.0');
  });

  it('should return highest matching versions for multiple package names', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.2.0', id: 'a2' },
      { name: 'packageB', version: '2.0.0', id: 'b1' },
      { name: 'packageB', version: '2.5.0', id: 'b2' },
      { name: 'packageC', version: '3.0.0', id: 'c1' },
    ];

    const results = highestVersionMatches(candidates, '>=1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(3);
    expect(results.find(r => r.name === 'packageA')?.id).toBe('a2');
    expect(results.find(r => r.name === 'packageB')?.id).toBe('b2');
    expect(results.find(r => r.name === 'packageC')?.id).toBe('c1');
  });

  it('should exclude packages that do not match the version range', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '2.0.0', id: 'a2' },
      { name: 'packageA', version: '3.0.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
    expect(results[0].version).toBe('1.0.0');
  });

  it('should return empty array when no versions match the range', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.2.0', id: 'a2' },
    ];

    const results = highestVersionMatches(candidates, '^2.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(0);
  });

  it('should exclude only names with no matching versions, not all results', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.5.0', id: 'a2' },
      { name: 'packageB', version: '3.0.0', id: 'b1' },
      { name: 'packageB', version: '3.5.0', id: 'b2' },
    ];

    // packageA versions match, packageB versions don't
    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('packageA');
    expect(results[0].id).toBe('a2');
  });

  it('should handle exact version match', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.2.0', id: 'a2' },
      { name: 'packageA', version: '1.5.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '1.2.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a2');
  });

  it('should handle wildcard range (any version)', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '5.0.0', id: 'a2' },
      { name: 'packageA', version: '3.0.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '*', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a2');
    expect(results[0].version).toBe('5.0.0');
  });

  it('should handle complex version ranges', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.5.0', id: 'a2' },
      { name: 'packageA', version: '2.0.0', id: 'a3' },
      { name: 'packageA', version: '2.5.0', id: 'a4' },
      { name: 'packageA', version: '3.0.0', id: 'a5' },
    ];

    const results = highestVersionMatches(candidates, '>=1.5.0 <3.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a4');
    expect(results[0].version).toBe('2.5.0');
  });

  it('should handle empty candidates array', () => {
    const candidates: TestPackage[] = [];

    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(0);
  });

  it('should handle single candidate that matches', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
    ];

    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
  });

  it('should handle single candidate that does not match', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
    ];

    const results = highestVersionMatches(candidates, '^2.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(0);
  });

  it('should skip candidates with invalid version formats', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: 'invalid', id: 'a2' },
      { name: 'packageA', version: '1.5.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '^1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a3');
    expect(results[0].version).toBe('1.5.0');
  });

  it('should handle pre-release versions', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.0.0', id: 'a1' },
      { name: 'packageA', version: '1.0.0-alpha.1', id: 'a2' },
      { name: 'packageA', version: '1.0.0-beta.1', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '>=1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
    expect(results[0].version).toBe('1.0.0');
  });

  it('should use custom extractors correctly', () => {
    interface CustomPackage {
      pkgName: string;
      versionNumber: string;
      metadata: string;
    }

    const candidates: CustomPackage[] = [
      { pkgName: 'custom', versionNumber: '1.0.0', metadata: 'old' },
      { pkgName: 'custom', versionNumber: '2.0.0', metadata: 'new' },
    ];

    const results = highestVersionMatches(
      candidates,
      '^1.0.0',
      (pkg) => pkg.pkgName,
      (pkg) => pkg.versionNumber
    );

    expect(results).toHaveLength(1);
    expect(results[0].metadata).toBe('old');
  });

  it('should handle tilde range correctly', () => {
    const candidates: TestPackage[] = [
      { name: 'packageA', version: '1.2.0', id: 'a1' },
      { name: 'packageA', version: '1.2.5', id: 'a2' },
      { name: 'packageA', version: '1.3.0', id: 'a3' },
    ];

    const results = highestVersionMatches(candidates, '~1.2.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a2');
    expect(results[0].version).toBe('1.2.5');
  });

  it('should handle many packages with many versions', () => {
    const candidates: TestPackage[] = [
      { name: 'pkg1', version: '1.0.0', id: '1a' },
      { name: 'pkg1', version: '1.5.0', id: '1b' },
      { name: 'pkg1', version: '2.0.0', id: '1c' },
      { name: 'pkg2', version: '0.5.0', id: '2a' },
      { name: 'pkg2', version: '1.0.0', id: '2b' },
      { name: 'pkg3', version: '3.0.0', id: '3a' },
      { name: 'pkg3', version: '3.5.0', id: '3b' },
      { name: 'pkg4', version: '1.0.0', id: '4a' },
      { name: 'pkg5', version: '10.0.0', id: '5a' },
    ];

    const results = highestVersionMatches(candidates, '>=1.0.0', nameExtractor, versionExtractor);

    expect(results).toHaveLength(5);
    expect(results.find(r => r.name === 'pkg1')?.id).toBe('1c');
    expect(results.find(r => r.name === 'pkg2')?.id).toBe('2b');
    expect(results.find(r => r.name === 'pkg3')?.id).toBe('3b');
    expect(results.find(r => r.name === 'pkg4')?.id).toBe('4a');
    expect(results.find(r => r.name === 'pkg5')?.id).toBe('5a');
  });
});

describe('bestVersionMatch', () => {
  interface TestService {
    name: string;
    version: string; // Version of the service itself
    supportedRange: string; // Version range this service supports
    id: string;
  }

  const nameExtractor = (svc: TestService) => svc.name;
  const versionExtractor = (svc: TestService) => svc.version;
  const rangeExtractor = (svc: TestService) => svc.supportedRange;

  it('should return the candidate whose range matches the requested version', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^2.0.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '1.5.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
  });

  it('should pick the highest version candidate among those whose range matches', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '1.5.0', supportedRange: '^1.0.0', id: 'a2' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^1.0.0', id: 'a3' },
    ];

    const results = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a3'); // Highest version that supports ^1.0.0 range
    expect(results[0].version).toBe('2.0.0');
  });

  it('should handle multiple service names independently', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '1.5.0', supportedRange: '^1.0.0', id: 'a2' },
      { name: 'serviceB', version: '2.0.0', supportedRange: '^2.0.0', id: 'b1' },
      { name: 'serviceB', version: '2.5.0', supportedRange: '^2.0.0', id: 'b2' },
    ];

    const results = bestVersionMatch(candidates, '2.3.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('serviceB');
    expect(results[0].id).toBe('b2'); // Highest version of serviceB
  });

  it('should exclude candidates whose range does not match the requested version', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^2.0.0', id: 'a2' },
      { name: 'serviceA', version: '3.0.0', supportedRange: '^3.0.0', id: 'a3' },
    ];

    const results = bestVersionMatch(candidates, '2.5.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a2');
  });

  it('should return empty array when no ranges match the requested version', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^2.0.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '5.0.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(0);
  });

  it('should handle wildcard ranges', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '*', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^2.0.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '1.5.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1'); // Only a1's range matches 1.5.0
  });

  it('should handle exact version ranges', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '1.5.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '1.6.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '1.5.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
  });

  it('should handle complex ranges', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '>=1.0.0 <2.0.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '>=2.0.0 <3.0.0', id: 'a2' },
      { name: 'serviceA', version: '3.0.0', supportedRange: '>=1.5.0 <2.5.0', id: 'a3' },
    ];

    const results = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a3'); // Highest version with matching range
    expect(results[0].version).toBe('3.0.0');
  });

  it('should handle empty candidates array', () => {
    const candidates: TestService[] = [];

    const results = bestVersionMatch(candidates, '1.0.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(0);
  });

  it('should skip candidates with invalid version or range formats', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: 'invalid', supportedRange: '^1.0.0', id: 'a2' },
      { name: 'serviceA', version: '2.0.0', supportedRange: 'bad-range', id: 'a3' },
      { name: 'serviceA', version: '1.5.0', supportedRange: '^1.0.0', id: 'a4' },
    ];

    const results = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a4'); // Only a1 and a4 are valid, a4 has higher version
  });

   it('should select highest appropriate', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceA', version: '1.0.3', supportedRange: '^1.0.0', id: 'a2' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '^1.5.0', id: 'a3' },
      { name: 'serviceA', version: '2.0.1', supportedRange: '^1.5.0', id: 'a4' },
      { name: 'serviceA', version: '1.5.0', supportedRange: '^1.8.0', id: 'a5' },
    ];

    const results = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a4'); // Only a1 and a4 are valid, a4 has higher version

    const results2 = bestVersionMatch(candidates, '1.0.1', nameExtractor, versionExtractor, rangeExtractor);

    expect(results2).toHaveLength(1);
    expect(results2[0].id).toBe('a2'); // Only a1 and a4 are valid, a4 has higher version

    const results3 = bestVersionMatch(candidates, '1.5.1', nameExtractor, versionExtractor, rangeExtractor);

    expect(results3).toHaveLength(1);
    expect(results3[0].id).toBe('a4'); // Only a1 and a4 are valid, a4 has higher version

    const results4 = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results4).toHaveLength(1);
    expect(results4[0].id).toBe('a5'); // Only a1 and a4 are valid, a4 has higher version
  });

  it('should handle multiple services where only some have matching ranges', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '^1.0.0', id: 'a1' },
      { name: 'serviceB', version: '2.0.0', supportedRange: '^3.0.0', id: 'b1' },
      { name: 'serviceC', version: '1.5.0', supportedRange: '^1.0.0', id: 'c1' },
    ];

    const results = bestVersionMatch(candidates, '1.8.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(2);
    expect(results.find(r => r.name === 'serviceA')?.id).toBe('a1');
    expect(results.find(r => r.name === 'serviceC')?.id).toBe('c1');
    expect(results.find(r => r.name === 'serviceB')).toBeUndefined();
  });

  it('should handle tilde ranges correctly', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '~1.2.0', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '~1.2.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '1.2.5', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a2'); // Highest version with matching range
  });

  it('should prefer higher version even when multiple ranges match', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '*', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '>=1.0.0', id: 'a2' },
      { name: 'serviceA', version: '3.0.0', supportedRange: '^1.0.0', id: 'a3' },
    ];

    const results = bestVersionMatch(candidates, '1.5.0', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a3'); // All ranges match, pick highest version
    expect(results[0].version).toBe('3.0.0');
  });

  it('should use custom extractors correctly', () => {
    interface CustomService {
      serviceName: string;
      serviceVersion: string;
      compatibleWith: string;
      metadata: string;
    }

    const candidates: CustomService[] = [
      { serviceName: 'custom', serviceVersion: '1.0.0', compatibleWith: '^1.0.0', metadata: 'old' },
      { serviceName: 'custom', serviceVersion: '2.0.0', compatibleWith: '^1.0.0', metadata: 'new' },
    ];

    const results = bestVersionMatch(
      candidates,
      '1.5.0',
      (svc) => svc.serviceName,
      (svc) => svc.serviceVersion,
      (svc) => svc.compatibleWith
    );

    expect(results).toHaveLength(1);
    expect(results[0].metadata).toBe('new'); // Higher version
  });

  it('should handle pre-release version requests', () => {
    const candidates: TestService[] = [
      { name: 'serviceA', version: '1.0.0', supportedRange: '>=1.0.0-alpha', id: 'a1' },
      { name: 'serviceA', version: '2.0.0', supportedRange: '>=1.0.0', id: 'a2' },
    ];

    const results = bestVersionMatch(candidates, '1.0.0-beta.1', nameExtractor, versionExtractor, rangeExtractor);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a1');
  });
});
