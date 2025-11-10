/**
 * Document processing functions for the docusaurus-plugin-llms plugin
 */
import { DocInfo, PluginContext } from './types';
/**
 * Process a markdown file and extract its metadata and content
 * @param filePath - Path to the markdown file
 * @param baseDir - Base directory
 * @param siteUrl - Base URL of the site
 * @param pathPrefix - Path prefix for URLs (e.g., 'docs' or 'blog')
 * @param pathTransformation - Path transformation configuration
 * @returns Processed file data
 */
export declare function processMarkdownFile(filePath: string, baseDir: string, siteUrl: string, pathPrefix?: string, pathTransformation?: {
    ignorePaths?: string[];
    addPaths?: string[];
}, excludeImports?: boolean, removeDuplicateHeadings?: boolean, resolvedUrl?: string): Promise<DocInfo | null>;
/**
 * Process files based on include patterns, ignore patterns, and ordering
 * @param context - Plugin context
 * @param allFiles - All available files
 * @param includePatterns - Patterns for files to include
 * @param ignorePatterns - Patterns for files to ignore
 * @param orderPatterns - Patterns for ordering files
 * @param includeUnmatched - Whether to include unmatched files
 * @returns Processed files
 */
export declare function processFilesWithPatterns(context: PluginContext, allFiles: string[], includePatterns?: string[], ignorePatterns?: string[], orderPatterns?: string[], includeUnmatched?: boolean): Promise<DocInfo[]>;
