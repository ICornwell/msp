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
declare class ExtensionTypeGenerator {
    private project;
    private config;
    private extensions;
    constructor(configPath: string);
    /**
     * Main entry point - scan files and generate types
     */
    generate(): Promise<void>;
    /**
     * Scan a single file for extension interfaces
     */
    private scanFile;
    /**
     * Check if an interface is an extension interface
     */
    private isExtensionInterface;
    /**
     * Extract method information from an extension interface
     */
    private extractExtensionInfo;
    /**
     * Check if return type is ReUiPlanElementSetBuilder
     */
    private returnsElementSetBuilder;
    /**
     * Check if return type is ReUiPlanComponentBuilder
     */
    private returnsComponentBuilder;
    /**
     * Check if return type is FluentSimple
     */
    private returnsFluentSimple;
    /**
     * Extract sub-builder type from FluentSubBuilder<Type<...>>
     * Returns the Type name if found, null otherwise
     *
     * Example: "FluentSubBuilder<ColumnBuilder<C, FluentSimple>>" -> "ColumnBuilder"
     */
    private extractSubBuilderType;
    /**
     * Generate the ExtensionOf type code
     */
    private generateExtensionOfType;
    /**
     * Write the generated file
     */
    private writeGeneratedFile;
    /**
     * Write an empty file when no extensions found
     */
    private writeEmptyFile;
}
export { ExtensionTypeGenerator };
