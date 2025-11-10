/**
 * Utility functions for the docusaurus-plugin-llms plugin
 */
import { PluginOptions } from './types';
/**
 * Write content to a file
 * @param filePath - Path to write the file to
 * @param data - Content to write
 */
export declare function writeFile(filePath: string, data: string): Promise<void>;
/**
 * Read content from a file
 * @param filePath - Path of the file to read
 * @returns Content of the file
 */
export declare function readFile(filePath: string): Promise<string>;
/**
 * Check if a file should be ignored based on glob patterns
 * @param filePath - Path to the file
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Whether the file should be ignored
 */
export declare function shouldIgnoreFile(filePath: string, baseDir: string, ignorePatterns: string[]): boolean;
/**
 * Recursively reads all Markdown files in a directory
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Array of file paths
 */
export declare function readMarkdownFiles(dir: string, baseDir: string, ignorePatterns?: string[]): Promise<string[]>;
/**
 * Extract title from content or use the filename
 * @param data - Frontmatter data
 * @param content - Markdown content
 * @param filePath - Path to the file
 * @returns Extracted title
 */
export declare function extractTitle(data: any, content: string, filePath: string): string;
/**
 * Resolve and inline partial imports in markdown content
 * @param content - The markdown content with import statements
 * @param filePath - The path of the file containing the imports
 * @returns Content with partials resolved
 */
export declare function resolvePartialImports(content: string, filePath: string): Promise<string>;
/**
 * Clean markdown content for LLM consumption
 * @param content - Raw markdown content
 * @param excludeImports - Whether to exclude import statements
 * @param removeDuplicateHeadings - Whether to remove redundant content that duplicates heading text
 * @returns Cleaned content
 */
export declare function cleanMarkdownContent(content: string, excludeImports?: boolean, removeDuplicateHeadings?: boolean): string;
/**
 * Apply path transformations according to configuration
 * @param urlPath - Original URL path
 * @param pathTransformation - Path transformation configuration
 * @returns Transformed URL path
 */
export declare function applyPathTransformations(urlPath: string, pathTransformation?: PluginOptions['pathTransformation']): string;
/**
 * Sanitize a string to create a safe filename
 * @param input - Input string (typically a title)
 * @param fallback - Fallback string if input becomes empty after sanitization
 * @returns Sanitized filename (without extension)
 */
export declare function sanitizeForFilename(input: string, fallback?: string): string;
/**
 * Ensure a unique identifier from a set of used identifiers
 * @param baseIdentifier - Base identifier to make unique
 * @param usedIdentifiers - Set of already used identifiers
 * @param suffix - Suffix pattern (default: number in parentheses)
 * @returns Unique identifier
 */
export declare function ensureUniqueIdentifier(baseIdentifier: string, usedIdentifiers: Set<string>, suffix?: (counter: number, base: string) => string): string;
/**
 * Create standardized markdown content template
 * @param title - Document title
 * @param description - Document description
 * @param content - Document content
 * @param includeMetadata - Whether to include description metadata
 * @param frontMatter - Optional frontmatter to include at the top
 * @returns Formatted markdown content
 */
export declare function createMarkdownContent(title: string, description?: string, content?: string, includeMetadata?: boolean, frontMatter?: Record<string, any>): string;
