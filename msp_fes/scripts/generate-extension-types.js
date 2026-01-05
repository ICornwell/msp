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
import { Project } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs/promises';
import { readFileSync } from 'fs';
class ExtensionTypeGenerator {
    project;
    config;
    extensions = [];
    constructor(configPath) {
        this.project = new Project({
            tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
        });
        // Read config file synchronously
        const configContent = JSON.parse(readFileSync(configPath, 'utf-8'));
        this.config = configContent;
    }
    /**
     * Main entry point - scan files and generate types
     */
    async generate() {
        console.log('🔍 Scanning extension files...\n');
        for (const filePath of this.config.extensionFiles) {
            await this.scanFile(filePath);
        }
        if (this.extensions.length === 0) {
            console.log('⚠️  No extensions found');
            await this.writeEmptyFile();
            return;
        }
        console.log(`\n✓ Found ${this.extensions.length} extension(s)\n`);
        this.extensions.forEach(ext => {
            console.log(`  • ${ext.name}`);
            console.log(`    Signature method: ${ext.signatureMethod}`);
            console.log(`    Methods: ${ext.methods.map(m => m.name).join(', ')}`);
        });
        await this.writeGeneratedFile();
        console.log(`\n✅ Generated: ${this.config.outputFile}`);
    }
    /**
     * Scan a single file for extension interfaces
     */
    async scanFile(filePath) {
        console.log(`  Scanning: ${filePath}`);
        const sourceFile = this.project.addSourceFileAtPath(filePath);
        const interfaces = sourceFile.getInterfaces();
        console.log(`    Found ${interfaces.length} interface(s)`);
        for (const iface of interfaces) {
            const ifaceName = iface.getName();
            console.log(`    Checking: ${ifaceName}`);
            if (this.isExtensionInterface(iface)) {
                console.log(`      ✓ Is extension!`);
                const info = this.extractExtensionInfo(iface, filePath);
                if (info) {
                    console.log(`      Extracted extension info for: ${info.name}`);
                    this.extensions.push(info);
                }
            }
        }
    }
    /**
     * Check if an interface is an extension interface
     */
    isExtensionInterface(iface) {
        const name = iface.getName();
        // Must end with "Extension"
        if (!name.endsWith('Extension'))
            return false;
        // Must extend ReExtensionBuilder
        const heritage = iface.getExtends();
        const extendsReExtensionBuilder = heritage.some(h => h.getText().includes('ReExtensionBuilder'));
        return extendsReExtensionBuilder;
    }
    /**
     * Extract method information from an extension interface
     */
    extractExtensionInfo(iface, sourceFile) {
        const name = iface.getName();
        const methods = [];
        const subBuilderTypes = new Set();
        // Get all method signatures
        for (const method of iface.getMethods()) {
            const methodName = method.getName();
            const returnTypeNode = method.getReturnTypeNode();
            const returnType = returnTypeNode?.getText() || 'unknown';
            const subBuilderType = this.extractSubBuilderType(returnType);
            if (subBuilderType) {
                subBuilderTypes.add(subBuilderType);
            }
            const methodInfo = {
                name: methodName,
                returnType,
                returnsElementSetBuilder: this.returnsElementSetBuilder(returnType),
                returnsComponentBuilder: this.returnsComponentBuilder(returnType),
                returnsFluentSimple: this.returnsFluentSimple(returnType),
                subBuilderType,
                returnsOther: !this.returnsElementSetBuilder(returnType) &&
                    !this.returnsComponentBuilder(returnType) &&
                    !this.returnsFluentSimple(returnType) &&
                    !subBuilderType
            };
            methods.push(methodInfo);
            console.log(`      Method: ${methodName} -> ${returnType}${subBuilderType ? ` [SubBuilder: ${subBuilderType}]` : ''}`);
        }
        // Also check property signatures (like containingSingle: Builder)
        for (const prop of iface.getProperties()) {
            const propName = prop.getName();
            const propType = prop.getType().getText();
            const subBuilderType = this.extractSubBuilderType(propType);
            if (subBuilderType) {
                subBuilderTypes.add(subBuilderType);
            }
            const methodInfo = {
                name: propName,
                returnType: propType,
                returnsElementSetBuilder: this.returnsElementSetBuilder(propType),
                returnsComponentBuilder: this.returnsComponentBuilder(propType),
                returnsFluentSimple: this.returnsFluentSimple(propType),
                subBuilderType,
                returnsOther: !this.returnsElementSetBuilder(propType) &&
                    !this.returnsComponentBuilder(propType) &&
                    !this.returnsFluentSimple(propType) &&
                    !subBuilderType
            };
            methods.push(methodInfo);
            console.log(`      Property: ${propName} -> ${propType}${subBuilderType ? ` [SubBuilder: ${subBuilderType}]` : ''}`);
        }
        // Find a signature method (first method that's unique to this extension)
        const signatureMethod = methods.length > 0 ? methods[0].name : '';
        // Extract component name from extension name (e.g., "TableExtension" -> "TableComponent")
        const componentName = name.replace(/Extension$/, 'Component');
        console.log(`      Total methods/properties: ${methods.length}, signature: ${signatureMethod}`);
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
            signatureMethod,
            componentName
        };
    }
    /**
     * Check if return type is ReUiPlanElementSetBuilder
     */
    returnsElementSetBuilder(returnType) {
        return returnType.includes('ReUiPlanElementSetBuilder');
    }
    /**
     * Check if return type is ReUiPlanComponentBuilder
     */
    returnsComponentBuilder(returnType) {
        return returnType.includes('ReUiPlanComponentBuilder');
    }
    /**
     * Check if return type is FluentSimple
     */
    returnsFluentSimple(returnType) {
        return returnType.includes('FluentSimple');
    }
    /**
     * Extract sub-builder type from FluentSubBuilder<Type<...>>
     * Returns the Type name if found, null otherwise
     *
     * Example: "FluentSubBuilder<ColumnBuilder<C, FluentSimple>>" -> "ColumnBuilder"
     */
    extractSubBuilderType(returnType) {
        // Match FluentSubBuilder<TypeName<...>> pattern
        const match = returnType.match(/FluentSubBuilder<(\w+)</);
        return match ? match[1] : null;
    }
    /**
     * Generate the ExtensionOf type code
     */
    generateExtensionOfType() {
        const extensionNames = this.extensions.map(e => e.name).join(', ');
        // Build discriminated union for each extension
        const extensionBranches = [];
        let itemCount = 0;
        for (const ext of this.extensions) {
            const hasSubBuilders = ext.subBuilderTypes.size > 0;
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
                        extensionBranches.push(`                ? ((...args: A) => ${subBuilder}<C, ComponentBuilderWithExt<C, typeof ${ext.componentName}, RT>>)`);
                    }
                    // Close the BLD2 extends chain
                    extensionBranches.push(`                : never`);
                }
                else {
                    extensionBranches.push(`              ? never`);
                }
                extensionBranches.push(`              : never // not pattern #2 either`);
                extensionBranches.push(`          // we are not a function`);
                extensionBranches.push(`          : E[K]`);
                extensionBranches.push(`      }`);
            }
            // Otherwise use the simpler pattern (for container extensions)
            else {
                extensionBranches.push(`        E[K] extends ((...args: infer A) => infer R)`);
                extensionBranches.push(`          ? R extends ${ext.name} <any, any>`);
                extensionBranches.push(`            ? (...args: A) => ${ext.name}<C, BLD & ExtensionOf<C, T, BLD, RT>>`);
                extensionBranches.push(`            : R extends ReBuilderBase<any>`);
                extensionBranches.push(`              ? E[K]`);
                extensionBranches.push(`              : (...args: A) => BLD & ExtensionOf<C, T, BLD, RT>`);
                extensionBranches.push(`          : E[K]`);
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
    : never
  : never;
`;
        return code;
    }
    /**
     * Write the generated file
     */
    async writeGeneratedFile() {
        const timestamp = new Date().toISOString();
        const extensionList = this.extensions.map(e => `//   - ${e.name} (${e.signatureMethod})`).join('\n');
        // Build imports - group by source file
        const importsByFile = new Map();
        for (const ext of this.extensions) {
            const relPath = path.relative(path.dirname(this.config.outputFile), ext.sourceFile)
                .replace(/\\/g, '/')
                .replace(/\.tsx?$/, '.tsx');
            if (!importsByFile.has(relPath)) {
                importsByFile.set(relPath, new Set());
            }
            const imports = importsByFile.get(relPath);
            imports.add(ext.name);
            // Add sub-builder types
            for (const subBuilder of ext.subBuilderTypes) {
                imports.add(subBuilder);
            }
            // Add component name (e.g., TableComponent)
            if (ext.subBuilderTypes.size > 0) {
                imports.add(ext.componentName);
            }
        }
        const extensionImports = Array.from(importsByFile.entries()).map(([filePath, imports]) => `import {${Array.from(imports).join(', ')}} from '${filePath}';`).join('\n');
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

${this.generateExtensionOfType()}

export type ReturnTypeOf<R> =
  R extends ReBuilderBase<any> ? (R extends ReBuilderBase<infer RT> ? RT : never) : never;


// Re-export for convenience
export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, RT> = 
  ReUiPlanComponentBuilder<C, T, RT> & ExtensionOf<C, T, ReUiPlanComponentBuilder<C, T, RT>, RT>;
`;
        await fs.writeFile(this.config.outputFile, content, 'utf-8');
    }
    /**
     * Write an empty file when no extensions found
     */
    async writeEmptyFile() {
        const content = `// ===================================================================
// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// ===================================================================
// No extensions found
// ===================================================================

import type { CNTX, ComponentWrapper } from './ReUiPlanBuilder';

export type ExtensionOf<C extends CNTX, T extends ComponentWrapper<any, any>, BLD = unknown> = {};

export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, RT> = RT;
`;
        await fs.writeFile(this.config.outputFile, content, 'utf-8');
    }
}
// ===================================================================
// CLI Entry Point
// ===================================================================
async function main() {
    const configPath = path.join(import.meta.dirname || __dirname, 'extension-types.config.json');
    console.log('Extension Type Generator\n');
    console.log(`Config: ${configPath}\n`);
    const generator = new ExtensionTypeGenerator(configPath);
    await generator.generate();
}
// Run if this is the main module
main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
export { ExtensionTypeGenerator };
//# sourceMappingURL=generate-extension-types.js.map