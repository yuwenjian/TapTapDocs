"use strict";
/**
 * Utility functions for the docusaurus-plugin-llms plugin
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFile = writeFile;
exports.readFile = readFile;
exports.shouldIgnoreFile = shouldIgnoreFile;
exports.readMarkdownFiles = readMarkdownFiles;
exports.extractTitle = extractTitle;
exports.resolvePartialImports = resolvePartialImports;
exports.cleanMarkdownContent = cleanMarkdownContent;
exports.applyPathTransformations = applyPathTransformations;
exports.sanitizeForFilename = sanitizeForFilename;
exports.ensureUniqueIdentifier = ensureUniqueIdentifier;
exports.createMarkdownContent = createMarkdownContent;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const minimatch_1 = require("minimatch");
const gray_matter_1 = __importDefault(require("gray-matter"));
const YAML = __importStar(require("yaml"));
/**
 * Write content to a file
 * @param filePath - Path to write the file to
 * @param data - Content to write
 */
async function writeFile(filePath, data) {
    return fs.writeFile(filePath, data, 'utf8');
}
/**
 * Read content from a file
 * @param filePath - Path of the file to read
 * @returns Content of the file
 */
async function readFile(filePath) {
    return fs.readFile(filePath, 'utf8');
}
/**
 * Check if a file should be ignored based on glob patterns
 * @param filePath - Path to the file
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Whether the file should be ignored
 */
function shouldIgnoreFile(filePath, baseDir, ignorePatterns) {
    if (ignorePatterns.length === 0) {
        return false;
    }
    const relativePath = path.relative(baseDir, filePath);
    return ignorePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern, { matchBase: true }));
}
/**
 * Recursively reads all Markdown files in a directory
 * @param dir - Directory to scan
 * @param baseDir - Base directory for relative paths
 * @param ignorePatterns - Glob patterns for files to ignore
 * @returns Array of file paths
 */
async function readMarkdownFiles(dir, baseDir, ignorePatterns = []) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (shouldIgnoreFile(fullPath, baseDir, ignorePatterns)) {
            continue;
        }
        if (entry.isDirectory()) {
            const subDirFiles = await readMarkdownFiles(fullPath, baseDir, ignorePatterns);
            files.push(...subDirFiles);
        }
        else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
            // Skip partial files (those starting with underscore)
            if (!entry.name.startsWith('_')) {
                files.push(fullPath);
            }
        }
    }
    return files;
}
/**
 * Extract title from content or use the filename
 * @param data - Frontmatter data
 * @param content - Markdown content
 * @param filePath - Path to the file
 * @returns Extracted title
 */
function extractTitle(data, content, filePath) {
    // First try frontmatter
    if (data.title) {
        return data.title;
    }
    // Then try first heading
    const headingMatch = content.match(/^#\s+(.*)/m);
    if (headingMatch) {
        return headingMatch[1].trim();
    }
    // Finally use filename
    return path.basename(filePath, path.extname(filePath))
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
/**
 * Resolve and inline partial imports in markdown content
 * @param content - The markdown content with import statements
 * @param filePath - The path of the file containing the imports
 * @returns Content with partials resolved
 */
async function resolvePartialImports(content, filePath) {
    let resolved = content;
    // Match import statements for partials and JSX usage
    // Pattern 1: import PartialName from './_partial.mdx'
    // Pattern 2: import { PartialName } from './_partial.mdx'
    const importRegex = /^\s*import\s+(?:(\w+)|{\s*(\w+)\s*})\s+from\s+['"]([^'"]+_[^'"]+\.mdx?)['"];?\s*$/gm;
    const imports = new Map();
    // First pass: collect all imports
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const componentName = match[1] || match[2];
        const importPath = match[3];
        // Only process imports for partial files (containing underscore)
        if (importPath.includes('_')) {
            imports.set(componentName, importPath);
        }
    }
    // Resolve each partial import
    for (const [componentName, importPath] of imports) {
        try {
            // Resolve the partial file path relative to the current file
            const dir = path.dirname(filePath);
            const partialPath = path.resolve(dir, importPath);
            // Read the partial file
            const partialContent = await readFile(partialPath);
            const { content: partialMarkdown } = (0, gray_matter_1.default)(partialContent);
            // Remove the import statement
            resolved = resolved.replace(new RegExp(`^\\s*import\\s+(?:${componentName}|{\\s*${componentName}\\s*})\\s+from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?\\s*$`, 'gm'), '');
            // Replace JSX usage with the partial content
            // Handle both self-closing tags and tags with content
            // <PartialName /> or <PartialName></PartialName> or <PartialName>...</PartialName>
            const jsxRegex = new RegExp(`<${componentName}\\s*(?:[^>]*?)(?:/>|>[^<]*</${componentName}>)`, 'g');
            resolved = resolved.replace(jsxRegex, partialMarkdown.trim());
        }
        catch (error) {
            console.warn(`Failed to resolve partial import "${importPath}" in ${filePath}: ${error}`);
            // Leave the import and usage as-is if we can't resolve it
        }
    }
    return resolved;
}
/**
 * Clean markdown content for LLM consumption
 * @param content - Raw markdown content
 * @param excludeImports - Whether to exclude import statements
 * @param removeDuplicateHeadings - Whether to remove redundant content that duplicates heading text
 * @returns Cleaned content
 */
function cleanMarkdownContent(content, excludeImports = false, removeDuplicateHeadings = false) {
    let cleaned = content;
    // Remove import statements if requested
    if (excludeImports) {
        // Remove ES6/React import statements
        // This regex matches:
        // - import ... from "...";
        // - import ... from '...';
        // - import { ... } from "...";
        // - import * as ... from "...";
        // - import "..."; (side-effect imports)
        cleaned = cleaned.replace(/^\s*import\s+.*?;?\s*$/gm, '');
    }
    // Remove HTML tags, but preserve XML content in code blocks
    // We need to be selective to avoid removing XML content from code blocks
    // This regex targets common HTML tags while being more conservative about XML
    cleaned = cleaned.replace(/<\/?(?:div|span|p|br|hr|img|a|strong|em|b|i|u|h[1-6]|ul|ol|li|table|tr|td|th|thead|tbody)\b[^>]*>/gi, '');
    // Remove redundant content that just repeats the heading (if requested)
    if (removeDuplicateHeadings) {
        // Split content into lines and process line by line
        const lines = cleaned.split('\n');
        const processedLines = [];
        let i = 0;
        while (i < lines.length) {
            const currentLine = lines[i];
            // Check if current line is a heading (accounting for leading whitespace)
            const headingMatch = currentLine.match(/^\s*(#+)\s+(.+)$/);
            if (headingMatch) {
                const headingLevel = headingMatch[1];
                const headingText = headingMatch[2].trim();
                processedLines.push(currentLine);
                i++;
                // Look ahead for potential redundant content
                // Skip empty lines
                while (i < lines.length && lines[i].trim() === '') {
                    processedLines.push(lines[i]);
                    i++;
                }
                // Check if the next non-empty line just repeats the heading text
                // but is NOT itself a heading (to avoid removing valid headings of different levels)
                if (i < lines.length) {
                    const nextLine = lines[i].trim();
                    const nextLineIsHeading = /^\s*#+\s+/.test(nextLine);
                    // Only remove if it exactly matches the heading text AND is not a heading itself
                    if (nextLine === headingText && !nextLineIsHeading) {
                        // Skip this redundant line
                        i++;
                    }
                }
            }
            else {
                processedLines.push(currentLine);
                i++;
            }
        }
        cleaned = processedLines.join('\n');
    }
    // Normalize whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleaned;
}
/**
 * Apply path transformations according to configuration
 * @param urlPath - Original URL path
 * @param pathTransformation - Path transformation configuration
 * @returns Transformed URL path
 */
function applyPathTransformations(urlPath, pathTransformation) {
    if (!pathTransformation) {
        return urlPath;
    }
    let transformedPath = urlPath;
    // Remove ignored path segments
    if (pathTransformation.ignorePaths?.length) {
        for (const ignorePath of pathTransformation.ignorePaths) {
            // Create a regex that matches the ignore path at the beginning, middle, or end of the path
            // We use word boundaries to ensure we match complete path segments
            const ignoreRegex = new RegExp(`(^|/)(${ignorePath})(/|$)`, 'g');
            transformedPath = transformedPath.replace(ignoreRegex, '$1$3');
        }
        // Clean up any double slashes that might have been created
        transformedPath = transformedPath.replace(/\/+/g, '/');
        // Remove leading slash if present
        transformedPath = transformedPath.replace(/^\//, '');
    }
    // Add path segments if they're not already present
    if (pathTransformation.addPaths?.length) {
        // Process in reverse order to maintain the specified order in the final path
        // This is because each path is prepended to the front
        const pathsToAdd = [...pathTransformation.addPaths].reverse();
        for (const addPath of pathsToAdd) {
            // Only add if not already present at the beginning
            if (!transformedPath.startsWith(addPath + '/') && transformedPath !== addPath) {
                transformedPath = `${addPath}/${transformedPath}`;
            }
        }
    }
    return transformedPath;
}
/**
 * Sanitize a string to create a safe filename
 * @param input - Input string (typically a title)
 * @param fallback - Fallback string if input becomes empty after sanitization
 * @returns Sanitized filename (without extension)
 */
function sanitizeForFilename(input, fallback = 'untitled') {
    if (!input)
        return fallback;
    const sanitized = input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return sanitized || fallback;
}
/**
 * Ensure a unique identifier from a set of used identifiers
 * @param baseIdentifier - Base identifier to make unique
 * @param usedIdentifiers - Set of already used identifiers
 * @param suffix - Suffix pattern (default: number in parentheses)
 * @returns Unique identifier
 */
function ensureUniqueIdentifier(baseIdentifier, usedIdentifiers, suffix = (counter) => `(${counter})`) {
    let uniqueIdentifier = baseIdentifier;
    let counter = 1;
    while (usedIdentifiers.has(uniqueIdentifier.toLowerCase())) {
        counter++;
        uniqueIdentifier = `${baseIdentifier}${suffix(counter, baseIdentifier)}`;
    }
    usedIdentifiers.add(uniqueIdentifier.toLowerCase());
    return uniqueIdentifier;
}
/**
 * Create standardized markdown content template
 * @param title - Document title
 * @param description - Document description
 * @param content - Document content
 * @param includeMetadata - Whether to include description metadata
 * @param frontMatter - Optional frontmatter to include at the top
 * @returns Formatted markdown content
 */
function createMarkdownContent(title, description = '', content = '', includeMetadata = true, frontMatter) {
    let result = '';
    // Add frontmatter if provided
    if (frontMatter && Object.keys(frontMatter).length > 0) {
        result += '---\n';
        result += YAML.stringify(frontMatter, {
            defaultStringType: 'PLAIN',
            defaultKeyType: 'PLAIN'
        });
        result += '---\n\n';
    }
    const descriptionLine = includeMetadata && description ? `\n\n> ${description}\n` : '\n';
    result += `# ${title}${descriptionLine}
${content}`.trim() + '\n';
    return result;
}
