#!/usr/bin/env tsx
/**
 * Extension Type Generator
 * 
 * Scans extension interface files and generates the ExtensionOf type that properly
 * substitutes CNTX and RT types for extension methods.
 * 
 * Phase 1: CLI-based scanner with explicit file list
 * Phase 2 (future): VS Code extension / TS language server integration
 * 
 * Usage:
 *   npm run generate:extension-types
 *   tsx scripts/generate-extension-types.ts
 */

import { Project, InterfaceDeclaration } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
import e from 'express';

interface ExtensionMethodInfo {
  name: string;
  returnType: string;
  returnsFluentSimple: boolean;
  subBuilderType: string | null;  // Extracted type from FluentSubBuilder<Type>
  returnsOther: boolean;
}

interface ExtensionInfo {
  name: string;
  sourceFile: string;
  methods: ExtensionMethodInfo[];
  subBuilderTypes: string[];  // All unique sub-builder types found
  componentName: string;  // e.g., "TableComponent" for TableExtension
}

interface Config {
  comment?: string;
  extensionFiles: string[];
  outputFile: string;
}

function ExtensionTypeGenerator(configPath: string): { generate: () => Promise<void> } {
  const project = new Project({ tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json') })
  const config: Config = JSON.parse(readFileSync(configPath, 'utf-8'));

  /**
   * Main entry point - scan files and generate types
   */

  async function generate(): Promise<void> {
    console.log('🔍 Scanning extension files...\n');

    const extensions: ExtensionInfo[] = config.extensionFiles.flatMap(filePath => scanFile(filePath));


    if (extensions.length === 0) {
      console.log('⚠️  No extensions found');
      await writeEmptyFile();
      return;
    }

    console.log(`\n✓ Found ${extensions.length} extension(s)\n`);
    extensions.forEach(ext => {
      console.log(`  • ${ext.name}`);
      console.log(`    Methods: ${ext.methods.map(m => m.name).join(', ')}`);
    });

    await writeGeneratedFile(extensions);
    console.log(`\n✅ Generated: ${config.outputFile}`);
  }

  /**
   * Scan a single file for extension interfaces
   */
  function scanFile(filePath: string): ExtensionInfo[] {
    console.log(`  Scanning: ${filePath}`);
    const sourceFile = project.addSourceFileAtPath(filePath);
    const interfaces = sourceFile.getInterfaces();
    console.log(`    Found ${interfaces.length} interface(s)`);

    const exts = interfaces.reduce((ac, iface) => {
      const ifaceName = iface.getName();
      console.log(`    Checking: ${ifaceName}`);
      if (isExtensionInterface(iface)) {
        console.log(`      ✓ Is extension!`);
        const info = extractExtensionInfo(iface, filePath);
        if (info) {
          console.log(`      Extracted extension info for: ${info.name}`);
          ac.push(info);
        }
      }
      return ac;
    }, [] as ExtensionInfo[]);
    return exts
  }

  /**
   * Check if an interface is an extension interface
   */
  function isExtensionInterface(iface: InterfaceDeclaration): boolean {
    const name = iface.getName();

    // Must end with "Extension"
    if (!name.endsWith('Extension')) return false;

    // Must extend ReExtensionBuilder
    const heritage = iface.getExtends();
    const extendsReExtensionBuilder = heritage.some(h =>
      h.getText().includes('ReExtensionBuilder')
    );

    return extendsReExtensionBuilder;
  }

  /**
   * Extract method information from an extension interface
   */
  function extractExtensionInfo(iface: InterfaceDeclaration, sourceFile: string): ExtensionInfo | null {
    const name = iface.getName();

    // Get all method signatures
    const methods: ExtensionMethodInfo[] = [
      ...iface.getMethods().map((method) => {
        const iName = method.getName();
        const returnTypeNode = method.getReturnTypeNode();
        const iReturnType = returnTypeNode?.getText() || 'unknown';

        const methodInfo = processFluentOperation(iReturnType, iName);
        console.log(`      Method: ${iName} -> ${iReturnType}${methodInfo.subBuilderType ? ` [SubBuilder: ${methodInfo.subBuilderType}]` : ''}`);
        return methodInfo;
      }),
      ...iface.getProperties().map((prop) => {

        const iName = prop.getName();
        const iReturnType = prop.getType().getText();

        const methodInfo = processFluentOperation(iReturnType, iName);
        console.log(`      Method: ${iName} -> ${iReturnType}${methodInfo.subBuilderType ? ` [SubBuilder: ${methodInfo.subBuilderType}]` : ''}`);
        return methodInfo
      })
    ];

    const subBuilderTypes = methods.filter(m => m.subBuilderType).map(m => m.subBuilderType!);
    // Extract component name from extension name (e.g., "TableExtension" -> "TableComponent")
    const componentName = name.replace(/Extension$/, 'Component');

    console.log(`      Total methods/properties: ${methods.length}`);
    console.log(`      SubBuilder types found: ${Array.from(subBuilderTypes).join(', ') || 'none'}`);
    console.log(`      Component name: ${componentName}`);

    if (methods.length === 0) {
      console.log(`      ✗ No methods/properties found, returning null`);
      return null;
    }

    return {
      name,
      sourceFile,
      methods,
      subBuilderTypes,
      componentName
    };
    // Helper to process a method/property and extract info
    function processFluentOperation(iReturnType: string, iName: string) {
      const returnsFluentSimple = iReturnType.includes('FluentSimple');
      const subBuilderType = iReturnType.match(/FluentSubBuilder<(\w+)</)?.[1] ?? null;

      return {
        name: iName,
        returnType: iReturnType,
        returnsFluentSimple: returnsFluentSimple,
        subBuilderType,
        returnsOther: !returnsFluentSimple && !subBuilderType
      };
    }
  }

  /**
   * Generate the ExtensionOf type code
   */
  const generateExtensionOfType = (extensions: ExtensionInfo[]): string => {
    const extensionNames = extensions.map(e => e.name).join(', ');

    // Build discriminated union for each extension
    const extensionBranches: string[] = [];
    let itemCount = 0;

    for (const ext of extensions) {
      const hasSubBuilders = ext.subBuilderTypes.length > 0;
      const hasFluentSimple = ext.methods.some(m => m.returnsFluentSimple);

      extensionBranches.push(`  // Handle ${ext.name}`);
      extensionBranches.push(` ${itemCount == 0 ? ' ' : ':'}  ${ext.name}<any, any> extends E`);
      extensionBranches.push(`    ? { [K in keyof E]:`);

      // If this extension uses FluentSimple/FluentSubBuilder pattern (like TableExtension)
      if (hasFluentSimple || hasSubBuilders) {
        extensionBranches.push(`        // calculate the new return type`);
        extensionBranches.push(`        E[K] extends ((...args: infer A) => infer R) // check for functions`);
        extensionBranches.push(`          //  we are a function`);
        extensionBranches.push(`          ? R extends FluentSimple  //check for simple pattern #1`);
        extensionBranches.push(`            // yes we are simple pattern #1`);
        extensionBranches.push(`            ? ((...args: A) => ReUiPlanComponentBuilder<C, T, RT> & ${ext.name}<C, RT>)`);
        extensionBranches.push(`            // not simple pattern #1, check for pattern #2`);
        extensionBranches.push(`            : R extends FluentSubBuilder<infer BLD2> // check for sub-builder pattern #2`);

        // Generate conditional for each sub-builder type
        if (hasSubBuilders) {
          const subBuilderArray = Array.from(ext.subBuilderTypes);
          for (let i = 0; i < subBuilderArray.length; i++) {
            const subBuilder = subBuilderArray[i];
            const isFirst = i === 0;
            const isLast = i === subBuilderArray.length - 1;

            extensionBranches.push(`              ${isFirst ? '?' : ':'} BLD2 extends ${subBuilder}<C, any>`);
            extensionBranches.push(`                ? ((...args: A) => ${subBuilder}<C, ComponentBuilderWithExt<C, T, RT>>)`);
          }
          // Close the BLD2 extends chain
          extensionBranches.push(`                : E[K]`);
        } else {
          extensionBranches.push(`              ? E[K]`);
        }
        extensionBranches.push(`              : E[K] // not pattern #2 either`);
        extensionBranches.push(`          // we are not a function`);
        extensionBranches.push(`          : E[K]`);
        extensionBranches.push(`      }`);
      }
      // Otherwise use the simpler pattern (for container extensions)
      else {
        extensionBranches.push(`       // nothing to do for ${ext.name}  - this shouldn't happen! `);
        extensionBranches.push(`          E[K]`);
        extensionBranches.push(`      }`);
      }
      itemCount++;
    }

    // Build the complete type
    let code = `/**
 * Maps extension methods to properly substitute CNTX and RT types.
 * Handles: ${extensionNames}
 */
export type ExtensionOf<C extends CNTX, T extends ComponentWrapper<any, any>, BLD = unknown, RT = any> =
  T extends ComponentWrapper<infer P, infer E>
    ? E extends object
      ? ${extensionBranches.join('\n     ')}
      : E  // Fallback: not a recognized extension, return as-is
    : E
  : never;
`;
    return code;
  }

  /**
   * Write the generated file
   */
  async function writeGeneratedFile(extensions: ExtensionInfo[]): Promise<void> {
    const timestamp = new Date().toISOString();
    const extensionList = extensions.map(e =>
      `//   - ${e.name}`
    ).join('\n');

    // Build imports - group by source file
    const importsByFile = new Map<string, Set<string>>();

    for (const ext of extensions) {
      const relPath = path.relative(path.dirname(config.outputFile), ext.sourceFile)
        .replace(/\\/g, '/')
        .replace(/\.tsx?$/, '.tsx');

      if (!importsByFile.has(relPath)) {
        importsByFile.set(relPath, new Set());
      }

      const imports = importsByFile.get(relPath)!;
      imports.add(ext.name);

      // Add sub-builder types
      for (const subBuilder of ext.subBuilderTypes) {
        imports.add(subBuilder);
      }
    }

    const extensionImports = Array.from(importsByFile.entries()).map(([filePath, imports]) =>
      `import {${Array.from(imports).join(', ')}} from '${filePath.replace(/\.tsx?$/, '.js')}';`
    ).join('\n');

    const content = `// ===================================================================
// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// ===================================================================
// Generated by: scripts/generate-extension-types.ts
// Generated at: ${timestamp}
// 
// This file provides CNTX type substitution for extension interfaces.
// Extension interfaces are defined with placeholder types at component
// definition time, but need concrete CNTX instances when builders are
// created. The ExtensionOf type performs this substitution.
//
// To regenerate: npm run generate:extension-types
//
// Detected extensions:
${extensionList}
// ===================================================================

import type { ComponentWrapper } from '../components/ReComponentWrapper';
import type { 
  CNTX,
  ReUiPlanComponentBuilder,
  ReBuilderBase, 
  FluentSimple,
  FluentSubBuilder
} from './ReUiPlanBuilder';

${extensionImports}

${generateExtensionOfType(extensions)}

export type ReturnTypeOf<R> =
  R extends ReBuilderBase<any> ? (R extends ReBuilderBase<infer RT> ? RT : never) : never;


// Re-export for convenience
export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, RT> = 
  ReUiPlanComponentBuilder<C, T, RT> & ExtensionOf<C, T, ReUiPlanComponentBuilder<C, T, RT>, RT>;
`;

    await fs.writeFile(config.outputFile, content, 'utf-8');
  }

  /**
   * Write an empty file when no extensions found
   */
  const writeEmptyFile = async (): Promise<void> => {
    const content = `// ===================================================================
// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// ===================================================================
// No extensions found
// ===================================================================

import type { CNTX, ComponentWrapper } from './ReUiPlanBuilder';

export type ExtensionOf<C extends CNTX, T extends ComponentWrapper<any, any>, BLD = unknown> = {};

export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, RT> = RT;
`;

    await fs.writeFile(config.outputFile, content, 'utf-8');
  }

  return { generate }
}

// ===================================================================
// CLI Entry Point
// ===================================================================

async function main() {
  const configPath = path.join(import.meta.dirname || __dirname, 'extension-types.config.json');

  console.log('Extension Type Generator\n');
  console.log(`Config: ${configPath}\n`);

  const generator = ExtensionTypeGenerator(configPath);
  await generator.generate();
}

// Run if this is the main module
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

export { ExtensionTypeGenerator };
