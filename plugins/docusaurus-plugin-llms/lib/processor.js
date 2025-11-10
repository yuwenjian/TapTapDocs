"use strict";
/**
 * Document processing functions for the docusaurus-plugin-llms plugin
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
exports.processMarkdownFile = processMarkdownFile;
exports.processFilesWithPatterns = processFilesWithPatterns;
const path = __importStar(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const minimatch_1 = require("minimatch");
const utils_1 = require("./utils");
/**
 * File extension pattern for detecting URLs that should not end with /
 * Matches common file extensions like .html, .md, .pdf, etc.
 */
const FILE_EXTENSION_PATTERN = /\.[a-zA-Z0-9]{1,10}$/;
/**
 * Normalize URL to ensure it ends with / unless it has a file extension
 * @param url - URL object to normalize
 * @returns Normalized URL string
 */
function normalizeUrlPath(url) {
    const pathname = url.pathname;
    // Don't add / if pathname already ends with / or has a file extension
    if (!pathname.endsWith('/') && !FILE_EXTENSION_PATTERN.test(pathname)) {
        url.pathname = pathname + '/';
    }
    return url.toString();
}
/**
 * Process a markdown file and extract its metadata and content
 * @param filePath - Path to the markdown file
 * @param baseDir - Base directory
 * @param siteUrl - Base URL of the site
 * @param pathPrefix - Path prefix for URLs (e.g., 'docs' or 'blog')
 * @param pathTransformation - Path transformation configuration
 * @returns Processed file data
 */
async function processMarkdownFile(filePath, baseDir, siteUrl, pathPrefix = 'docs', pathTransformation, excludeImports = false, removeDuplicateHeadings = false, resolvedUrl) {
    const content = await (0, utils_1.readFile)(filePath);
    const { data, content: markdownContent } = (0, gray_matter_1.default)(content);
    // Skip draft files
    if (data.draft === true) {
        return null;
    }
    // Resolve partial imports before processing
    const resolvedContent = await (0, utils_1.resolvePartialImports)(markdownContent, filePath);
    const relativePath = path.relative(baseDir, filePath);
    // Convert to URL path format (replace backslashes with forward slashes on Windows)
    const normalizedPath = relativePath.replace(/\\/g, '/');
    let fullUrl;
    if (resolvedUrl) {
        // Use the actual resolved URL from Docusaurus if provided
        const url = new URL(resolvedUrl, siteUrl);
        fullUrl = normalizeUrlPath(url);
    }
    else {
        // Fallback to the old path construction method
        // Convert .md extension to appropriate path
        let linkPathBase = normalizedPath.replace(/\.mdx?$/, '');
        // Handle index files specially
        let linkPath = linkPathBase.endsWith('index')
            ? linkPathBase.replace(/\/index$/, '')
            : linkPathBase;
        // Apply slug from frontmatter if available
        // Docusaurus uses slug to override the default file path
        if (data.slug) {
            const slug = String(data.slug);
            // If slug starts with /, it's an absolute path (relative to site root)
            if (slug.startsWith('/')) {
                // Remove leading slash and use as-is (will be combined with pathPrefix later)
                linkPath = slug.substring(1);
            }
            else {
                // Relative slug: replaces the last segment of the path
                const cleanSlug = slug.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
                if (cleanSlug) {
                    const pathParts = linkPath.split('/');
                    if (pathParts.length > 0) {
                        // Replace the last segment with the slug
                        pathParts[pathParts.length - 1] = cleanSlug;
                        linkPath = pathParts.join('/');
                    }
                    else {
                        // If linkPath is empty, use slug directly
                        linkPath = cleanSlug;
                    }
                }
            }
        }
        else if (data.id) {
            // Fallback to id if slug is not available
            // id replaces the last segment of the path
            const id = String(data.id);
            const pathParts = linkPath.split('/');
            if (pathParts.length > 0) {
                pathParts[pathParts.length - 1] = id;
                linkPath = pathParts.join('/');
            }
            else {
                linkPath = id;
            }
        }
        // linkPath might include the pathPrefix (e.g., "docs/api/core")
        // We need to remove the pathPrefix before applying transformations, then add it back later
        if (pathPrefix && linkPath.startsWith(`${pathPrefix}/`)) {
            linkPath = linkPath.substring(`${pathPrefix}/`.length);
        }
        else if (pathPrefix && linkPath === pathPrefix) {
            linkPath = '';
        }
        // Apply path transformations to the clean link path (without pathPrefix)
        const transformedLinkPath = (0, utils_1.applyPathTransformations)(linkPath, pathTransformation);
        // Also apply path transformations to the pathPrefix if it's not empty
        // This allows removing 'docs' from the path when specified in ignorePaths
        let transformedPathPrefix = pathPrefix;
        if (pathPrefix && pathTransformation?.ignorePaths?.includes(pathPrefix)) {
            transformedPathPrefix = '';
        }
        // Generate full URL with transformed path and path prefix
        const urlPath = `${transformedPathPrefix ? `${transformedPathPrefix}/` : ''}${transformedLinkPath}`;
        const url = new URL(urlPath, siteUrl);
        fullUrl = normalizeUrlPath(url);
    }
    // Extract title
    const title = (0, utils_1.extractTitle)(data, resolvedContent, filePath);
    // Get description from frontmatter only (do not extract from content)
    let description = '';
    // Only use frontmatter description if available
    if (data.description) {
        description = data.description;
    }
    // Only remove heading markers at the beginning of descriptions or lines
    // This preserves # characters that are part of the content
    if (description) {
        // Original approach had issues with hashtags inside content
        // Fix: Only remove # symbols at the beginning of lines or description
        // that are followed by a space (actual heading markers)
        description = description.replace(/^(#+)\s+/gm, '');
        // Special handling for description frontmatter with heading markers
        if (data.description && data.description.startsWith('#')) {
            // If the description in frontmatter starts with a heading marker,
            // we should preserve it in the extracted description
            description = description.replace(/^#+\s+/, '');
        }
        // Preserve inline hashtags (not heading markers)
        // We don't want to treat hashtags in the middle of content as headings
        // Validate that the description doesn't contain markdown headings
        if (description.match(/^#+\s+/m)) {
            console.warn(`Warning: Description for "${title}" may still contain heading markers`);
        }
        // Warn if the description contains HTML tags
        if (/<[^>]+>/g.test(description)) {
            console.warn(`Warning: Description for "${title}" contains HTML tags`);
        }
        // Warn if the description is very long
        if (description.length > 500) {
            console.warn(`Warning: Description for "${title}" is very long (${description.length} characters)`);
        }
    }
    // Clean and process content (now with partials already resolved)
    const cleanedContent = (0, utils_1.cleanMarkdownContent)(resolvedContent, excludeImports, removeDuplicateHeadings);
    return {
        title,
        path: normalizedPath,
        url: fullUrl,
        content: cleanedContent,
        description: description || '',
        frontMatter: data,
    };
}
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
async function processFilesWithPatterns(context, allFiles, includePatterns = [], ignorePatterns = [], orderPatterns = [], includeUnmatched = false) {
    const { siteDir, siteUrl, docsDir } = context;
    // Filter files based on include patterns
    let filteredFiles = allFiles;
    if (includePatterns.length > 0) {
        filteredFiles = allFiles.filter(file => {
            const relativePath = path.relative(siteDir, file);
            return includePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern, { matchBase: true }));
        });
    }
    // Apply ignore patterns
    if (ignorePatterns.length > 0) {
        filteredFiles = filteredFiles.filter(file => {
            const relativePath = path.relative(siteDir, file);
            return !ignorePatterns.some(pattern => (0, minimatch_1.minimatch)(relativePath, pattern, { matchBase: true }));
        });
    }
    // Order files according to orderPatterns
    let filesToProcess = [];
    if (orderPatterns.length > 0) {
        const matchedFiles = new Set();
        // Process files according to orderPatterns
        for (const pattern of orderPatterns) {
            const matchingFiles = filteredFiles.filter(file => {
                const relativePath = path.relative(siteDir, file);
                return (0, minimatch_1.minimatch)(relativePath, pattern, { matchBase: true }) && !matchedFiles.has(file);
            });
            for (const file of matchingFiles) {
                filesToProcess.push(file);
                matchedFiles.add(file);
            }
        }
        // Add remaining files if includeUnmatched is true
        if (includeUnmatched) {
            const remainingFiles = filteredFiles.filter(file => !matchedFiles.has(file));
            filesToProcess.push(...remainingFiles);
        }
    }
    else {
        filesToProcess = filteredFiles;
    }
    // Process each file to generate DocInfo
    const processedDocs = [];
    for (const filePath of filesToProcess) {
        try {
            // Determine if this is a blog or docs file
            const isBlogFile = filePath.includes(path.join(siteDir, 'blog'));
            // Use siteDir as baseDir to preserve full directory structure (docs/path/file.md instead of just path/file.md)
            const baseDir = siteDir;
            const pathPrefix = isBlogFile ? 'blog' : 'docs';
            // Try to find the resolved URL for this file from the route map
            let resolvedUrl;
            if (context.routeMap) {
                // Convert file path to a potential route path
                const relativePath = path.relative(baseDir, filePath)
                    .replace(/\\/g, '/')
                    .replace(/\.mdx?$/, '')
                    .replace(/\/index$/, '');
                // Function to remove numbered prefixes from path segments
                const removeNumberedPrefixes = (path) => {
                    return path.split('/').map(segment => {
                        // Remove numbered prefixes like "01-", "1-", "001-" from each segment
                        return segment.replace(/^\d+-/, '');
                    }).join('/');
                };
                // Check various possible route patterns
                const cleanPath = removeNumberedPrefixes(relativePath);
                const possiblePaths = [
                    `/${pathPrefix}/${cleanPath}`,
                    `/${cleanPath}`,
                    `/${pathPrefix}/${relativePath}`, // Try with original path
                    `/${relativePath}`, // Try without prefix
                ];
                // Also handle nested folder structures with numbered prefixes
                const segments = relativePath.split('/');
                if (segments.length > 1) {
                    // Try removing numbered prefixes from different levels
                    for (let i = 0; i < segments.length; i++) {
                        const modifiedSegments = [...segments];
                        modifiedSegments[i] = modifiedSegments[i].replace(/^\d+-/, '');
                        const modifiedPath = modifiedSegments.join('/');
                        possiblePaths.push(`/${pathPrefix}/${modifiedPath}`);
                        possiblePaths.push(`/${modifiedPath}`);
                    }
                }
                // Try to find a match in the route map
                for (const possiblePath of possiblePaths) {
                    if (context.routeMap.has(possiblePath)) {
                        resolvedUrl = context.routeMap.get(possiblePath);
                        break;
                    }
                }
                // If still not found, try to find the best match using the routesPaths array
                if (!resolvedUrl && context.routesPaths) {
                    const normalizedCleanPath = cleanPath.toLowerCase();
                    const matchingRoute = context.routesPaths.find(routePath => {
                        const normalizedRoute = routePath.toLowerCase();
                        return normalizedRoute.endsWith(`/${normalizedCleanPath}`) ||
                            normalizedRoute === `/${pathPrefix}/${normalizedCleanPath}` ||
                            normalizedRoute === `/${normalizedCleanPath}`;
                    });
                    if (matchingRoute) {
                        resolvedUrl = matchingRoute;
                    }
                }
                // Log when we successfully resolve a URL using Docusaurus routes
                if (resolvedUrl && resolvedUrl !== `/${pathPrefix}/${relativePath}`) {
                    console.log(`Resolved URL for ${path.basename(filePath)}: ${resolvedUrl} (was: /${pathPrefix}/${relativePath})`);
                }
            }
            const docInfo = await processMarkdownFile(filePath, baseDir, siteUrl, pathPrefix, context.options.pathTransformation, context.options.excludeImports || false, context.options.removeDuplicateHeadings || false, resolvedUrl);
            if (docInfo !== null) {
                processedDocs.push(docInfo);
            }
        }
        catch (err) {
            console.warn(`Error processing ${filePath}: ${err.message}`);
        }
    }
    return processedDocs;
}
