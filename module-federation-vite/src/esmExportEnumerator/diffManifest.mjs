/**
 * diffManifest.mjs
 *
 * Compares freshly-enumerated named exports against an existing manifest entry.
 * Produces a structured diff: additions, removals, and unchanged exports.
 *
 * Also handles the case where a package is not yet in the manifest (new entry).
 */

/** @typedef {{ package: string, module: string, factory: string, namedExports?: string[] }} ManifestEntry */

/**
 * @typedef {{
 *   specifier: string,
 *   status: 'new' | 'updated' | 'unchanged' | 'unresolved',
 *   added: string[],
 *   removed: string[],
 *   unchanged: string[],
 *   currentNamed: string[],  // what the live enumeration found
 *   manifestNamed: string[], // what was in the manifest (empty array if new entry)
 * }} ManifestDiff
 */

/**
 * Diff the result of enumerating a package's exports against the current manifest.
 *
 * @param {string} specifier
 * @param {string[]} liveNamed  sorted named exports from enumeratePackageExports
 * @param {ManifestEntry | undefined} existingEntry  current manifest entry (if any)
 * @returns {ManifestDiff}
 */
export function diffManifest(specifier, liveNamed, existingEntry) {
  const manifestNamed = existingEntry?.namedExports ?? [];

  const liveSet = new Set(liveNamed);
  const manifestSet = new Set(manifestNamed);

  const added = liveNamed.filter((n) => !manifestSet.has(n));
  const removed = manifestNamed.filter((n) => !liveSet.has(n));
  const unchanged = liveNamed.filter((n) => manifestSet.has(n));

  let status;
  if (!existingEntry) {
    status = 'new';
  } else if (added.length > 0 || removed.length > 0) {
    status = 'updated';
  } else {
    status = 'unchanged';
  }

  return {
    specifier,
    status,
    added,
    removed,
    unchanged,
    currentNamed: liveNamed,
    manifestNamed,
  };
}

/**
 * Format a diff result for human-readable terminal output.
 * @param {ManifestDiff} diff
 * @param {{ verbose?: boolean }} [opts]
 * @returns {string}
 */
export function formatDiff(diff, { verbose = false } = {}) {
  const lines = [];
  const { specifier, status, added, removed, unchanged } = diff;

  if (status === 'unchanged' && !verbose) return '';

  const statusLabel = {
    new: '\x1b[32m[NEW]\x1b[0m',
    updated: '\x1b[33m[UPDATED]\x1b[0m',
    unchanged: '\x1b[90m[OK]\x1b[0m',
    unresolved: '\x1b[31m[UNRESOLVED]\x1b[0m',
  }[status];

  lines.push(`${statusLabel} ${specifier}`);

  if (status === 'new') {
    lines.push(`  + ${diff.currentNamed.length} exports: ${diff.currentNamed.slice(0, 6).join(', ')}${diff.currentNamed.length > 6 ? ` … +${diff.currentNamed.length - 6} more` : ''}`);
    return lines.join('\n');
  }

  for (const name of added) lines.push(`  \x1b[32m+ ${name}\x1b[0m`);
  for (const name of removed) lines.push(`  \x1b[31m- ${name}\x1b[0m`);

  if (verbose) {
    for (const name of unchanged) lines.push(`    ${name}`);
  }

  return lines.join('\n');
}

/**
 * Apply a diff to an existing manifest entries array, returning an updated copy.
 * Preserves all existing fields (module, factory) and only updates namedExports.
 *
 * @param {ManifestEntry[]} entries
 * @param {ManifestDiff} diff
 * @returns {ManifestEntry[]}
 */
export function applyDiffToManifest(entries, diff) {
  if (diff.status === 'unchanged' || diff.status === 'unresolved') {
    return entries;
  }

  const idx = entries.findIndex((e) => e.package === diff.specifier);

  if (diff.status === 'new' || idx === -1) {
    // Generate a camelCase factory name from the specifier
    const factory = specifierToFactoryName(diff.specifier);
    const module = specifierToModulePath(diff.specifier);
    return [
      ...entries,
      {
        package: diff.specifier,
        module,
        factory,
        namedExports: diff.currentNamed,
      },
    ];
  }

  // Update existing entry
  const updated = [...entries];
  updated[idx] = {
    ...updated[idx],
    namedExports: diff.currentNamed,
  };
  return updated;
}

/**
 * Convert a package specifier to a camelCase factory function name.
 * e.g. '@azure/msal-browser' → 'msalBrowserExportCode'
 *      'msp_ui_common/uiLib/components' → 'mspUiCommonComponentsExportCode'
 */
function specifierToFactoryName(specifier) {
  const parts = specifier
    .replace(/^@[^/]+\//, '') // strip scope
    .split(/[\/\-_]+/)
    .filter(Boolean)
    .map((p, i) => i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase());
  return parts.join('') + 'ExportCode';
}

/**
 * Convert a package specifier to a relative module path for the factory file.
 * e.g. '@azure/msal-browser' → './msalBrowser'
 *      'msp_ui_common/uiLib/components' → './mspUiCommonComponents'
 */
function specifierToModulePath(specifier) {
  const name = specifierToFactoryName(specifier).replace(/ExportCode$/, '');
  return `./${name}`;
}
