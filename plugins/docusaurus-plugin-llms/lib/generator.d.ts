/**
 * LLM file generation functions for the docusaurus-plugin-llms plugin
 */
import { DocInfo, PluginContext } from './types';
/**
 * Generate an LLM-friendly file
 * @param docs - Processed document information
 * @param outputPath - Path to write the output file
 * @param fileTitle - Title for the file
 * @param fileDescription - Description for the file
 * @param includeFullContent - Whether to include full content or just links
 * @param version - Version of the file
 * @param customRootContent - Optional custom content to include at the root level
 * @param siteDir - Site directory (optional, needed for category position sorting)
 * @param docsDir - Docs directory name (optional, needed for category position sorting)
 * @param includeDescriptionInLinks - Whether to include description in links (default: true)
 */
export declare function generateLLMFile(docs: DocInfo[], outputPath: string, fileTitle: string, fileDescription: string, includeFullContent: boolean, version?: string, customRootContent?: string, siteDir?: string, docsDir?: string, includeDescriptionInLinks?: boolean): Promise<void>;
/**
 * Generate individual markdown files for each document
 * @param docs - Processed document information
 * @param outputDir - Directory to write the markdown files
 * @param siteUrl - Base site URL
 * @param docsDir - The configured docs directory name (e.g., 'docs', 'documentation', etc.)
 * @param keepFrontMatter - Array of frontmatter keys to preserve in generated files
 * @returns Updated docs with new URLs pointing to generated markdown files
 */
export declare function generateIndividualMarkdownFiles(docs: DocInfo[], outputDir: string, siteUrl: string, docsDir?: string, keepFrontMatter?: string[]): Promise<DocInfo[]>;
/**
 * Generate standard LLM files (llms.txt and llms-full.txt)
 * @param context - Plugin context
 * @param allDocFiles - Array of all document files
 */
export declare function generateStandardLLMFiles(context: PluginContext, allDocFiles: string[]): Promise<void>;
/**
 * Generate custom LLM files based on configuration
 * @param context - Plugin context
 * @param allDocFiles - Array of all document files
 */
export declare function generateCustomLLMFiles(context: PluginContext, allDocFiles: string[]): Promise<void>;
/**
 * Collect all document files from docs directory and optionally blog
 * Note: This function is only called for the default locale build,
 * as non-default locales are filtered out in postBuild hook
 * @param context - Plugin context
 * @returns Array of file paths
 */
export declare function collectDocFiles(context: PluginContext): Promise<string[]>;
