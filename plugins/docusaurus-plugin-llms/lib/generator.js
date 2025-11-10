"use strict";
/**
 * LLM file generation functions for the docusaurus-plugin-llms plugin
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLLMFile = generateLLMFile;
exports.generateIndividualMarkdownFiles = generateIndividualMarkdownFiles;
exports.generateStandardLLMFiles = generateStandardLLMFiles;
exports.generateCustomLLMFiles = generateCustomLLMFiles;
exports.collectDocFiles = collectDocFiles;
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const utils_1 = require("./utils");
const processor_1 = require("./processor");
/**
 * Clean a description for use in a TOC item
 * @param description - The original description
 * @returns Cleaned description suitable for TOC
 */
function cleanDescriptionForToc(description) {
    if (!description)
        return '';
    // Get just the first line for TOC display
    const firstLine = description.split('\n')[0];
    // Remove heading markers only at the beginning of the line
    // Be careful to only remove actual heading markers (# followed by space at beginning)
    // and not hashtag symbols that are part of the content (inline hashtags)
    const cleaned = firstLine.replace(/^(#+)\s+/g, '');
    // Truncate if too long (150 characters max with ellipsis)
    return cleaned.length > 150 ? cleaned.substring(0, 147) + '...' : cleaned;
}
/**
 * Extract category name from document path
 * @param docPath - Document path (e.g., '/docs/sdk/access/android-md5')
 * @returns Category name (e.g., 'access')
 */
function extractCategoryFromPath(docPath) {
    // Remove leading/trailing slashes and split by '/'
    const parts = docPath.replace(/^\/+|\/+$/g, '').split('/');
    // If path has at least 3 parts (e.g., docs/sdk/access), use the third part as category
    // Otherwise, use the second part, or fallback to 'other'
    if (parts.length >= 3) {
        return parts[2]; // e.g., 'access' from 'docs/sdk/access/android-md5'
    }
    else if (parts.length >= 2) {
        return parts[1]; // e.g., 'pc' from 'docs/pc/cpp-sdk'
    }
    return 'other';
}
/**
 * Extract subdirectory name from document path within a category
 * @param docPath - Document path (e.g., '/docs/sdk/start/release-notes/unity')
 * @param docsDir - Docs directory name (e.g., 'docs')
 * @returns Subdirectory name (e.g., 'release-notes') or null if at category root
 */
function extractSubdirectoryFromPath(docPath, docsDir) {
    // Remove leading/trailing slashes and file extension, then split by '/'
    const parts = docPath.replace(/^\/+|\/+$/g, '').replace(/\.mdx?$/, '').split('/');
    // For paths like docs/sdk/start/release-notes/unity (5 parts), return 'release-notes'
    // For paths like docs/sdk/start/agreement (4 parts), return null (at category root)
    // We need at least 5 parts to have a subdirectory: docs/sdk/category/subdir/file
    if (parts.length >= 5 && parts[0] === docsDir) {
        return parts[3]; // e.g., 'release-notes' from 'docs/sdk/start/release-notes/unity'
    }
    return null; // Document is at category root level
}
/**
 * Format category name for display (capitalize and replace hyphens with spaces)
 * @param category - Category name (e.g., 'getting-started')
 * @returns Formatted category name (e.g., 'Getting started')
 */
function formatCategoryName(category) {
    return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
/**
 * Sort documents by sidebar_position, then by path
 * @param docs - Array of documents to sort
 * @returns Sorted array of documents
 */
function sortDocsByPosition(docs) {
    return [...docs].sort((a, b) => {
        const posA = a.frontMatter?.sidebar_position ?? 999;
        const posB = b.frontMatter?.sidebar_position ?? 999;
        if (posA !== posB) {
            return posA - posB;
        }
        return a.path.localeCompare(b.path);
    });
}
/**
 * Generate a link item from a document
 * @param doc - Document information
 * @param includeDescription - Whether to include description in the link
 * @returns Formatted link string
 */
function generateLinkItem(doc, includeDescription) {
    if (includeDescription) {
        const cleanedDescription = cleanDescriptionForToc(doc.description);
        return `- [${doc.title}](${doc.url})${cleanedDescription ? `: ${cleanedDescription}` : ''}`;
    }
    else {
        return `- [${doc.title}](${doc.url})`;
    }
}
/**
 * Read category metadata from _category_.json file
 * @param categoryPath - Path to the category directory
 * @returns Category metadata with position and label, or null if not found
 */
async function readCategoryMetadata(categoryPath) {
    try {
        const categoryJsonPath = path.join(categoryPath, '_category_.json');
        const content = await fs.readFile(categoryJsonPath, 'utf8');
        const categoryData = JSON.parse(content);
        return {
            position: categoryData.position !== undefined ? categoryData.position : 999,
            label: categoryData.label || null
        };
    }
    catch {
        return null;
    }
}
/**
 * Get category metadata from document path
 * @param docPath - Document path
 * @param siteDir - Site directory
 * @param docsDir - Docs directory name
 * @returns Category metadata with position and label
 */
async function getCategoryMetadata(docPath, siteDir, docsDir) {
    // Extract category directory path from doc path
    // docPath might be: 'docs/sdk/access/android-md5' or '/docs/sdk/access/android-md5.mdx'
    // Remove leading/trailing slashes and file extension
    let cleanPath = docPath.replace(/^\/+|\/+$/g, '').replace(/\.mdx?$/, '');
    const pathParts = cleanPath.split('/');
    // Find the category directory (third part for docs/sdk/category or second for docs/category)
    let categoryDir;
    if (pathParts.length >= 3 && pathParts[0] === docsDir) {
        // docs/sdk/access/android-md5 -> docs/sdk/access
        categoryDir = path.join(siteDir, pathParts.slice(0, 3).join('/'));
    }
    else if (pathParts.length >= 2 && pathParts[0] === docsDir) {
        // docs/pc/cpp-sdk -> docs/pc
        categoryDir = path.join(siteDir, pathParts.slice(0, 2).join('/'));
    }
    else {
        return { position: 999, label: null }; // Default for unknown categories
    }
    const metadata = await readCategoryMetadata(categoryDir);
    return metadata || { position: 999, label: null };
}
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
async function generateLLMFile(docs, outputPath, fileTitle, fileDescription, includeFullContent, version, customRootContent, siteDir, docsDir, includeDescriptionInLinks = true) {
    console.log(`Generating file: ${outputPath}, version: ${version || 'undefined'}`);
    const versionInfo = version ? `\n\nVersion: ${version}` : '';
    if (includeFullContent) {
        // Generate full content file with header deduplication
        const usedHeaders = new Set();
        const fullContentSections = docs.map(doc => {
            // Check if content already starts with the same heading to avoid duplication
            const trimmedContent = doc.content.trim();
            const firstLine = trimmedContent.split('\n')[0];
            // Check if the first line is a heading that matches our title
            const headingMatch = firstLine.match(/^#+\s+(.+)$/);
            const firstHeadingText = headingMatch ? headingMatch[1].trim() : null;
            // Generate unique header using the utility function
            const uniqueHeader = (0, utils_1.ensureUniqueIdentifier)(doc.title, usedHeaders, (counter, base) => {
                // Try to make it more descriptive by adding the file path info if available
                if (doc.path && counter === 2) {
                    const pathParts = doc.path.split('/');
                    const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';
                    if (folderName) {
                        return `(${folderName.charAt(0).toUpperCase() + folderName.slice(1)})`;
                    }
                }
                return `(${counter})`;
            });
            if (firstHeadingText === doc.title) {
                // Content already has the same heading, replace it with our unique header if needed
                if (uniqueHeader !== doc.title) {
                    const restOfContent = trimmedContent.split('\n').slice(1).join('\n');
                    return `## ${uniqueHeader}

${restOfContent}`;
                }
                else {
                    // Replace the existing H1 with H2 to comply with llmstxt.org standard
                    const restOfContent = trimmedContent.split('\n').slice(1).join('\n');
                    return `## ${uniqueHeader}

${restOfContent}`;
                }
            }
            else {
                // Content doesn't have the same heading, add our unique H2 header
                return `## ${uniqueHeader}

${doc.content}`;
            }
        });
        // Use custom root content or default message
        const rootContent = customRootContent || 'This file contains all documentation content in a single document following the llmstxt.org standard.';
        const llmFileContent = (0, utils_1.createMarkdownContent)(fileTitle, `${fileDescription}${versionInfo}`, `${rootContent}\n\n${fullContentSections.join('\n\n---\n\n')}`, true // include metadata (description)
        );
        await (0, utils_1.writeFile)(outputPath, llmFileContent);
    }
    else {
        // Generate links-only file grouped by category
        // Group docs by category
        const docsByCategory = new Map();
        for (const doc of docs) {
            const category = extractCategoryFromPath(doc.path);
            if (!docsByCategory.has(category)) {
                docsByCategory.set(category, []);
            }
            docsByCategory.get(category).push(doc);
        }
        // Sort categories by position from _category_.json, then alphabetically
        // Also collect category labels for display
        const categoryMetadataMap = new Map();
        if (siteDir && docsDir) {
            // Read metadata for all categories
            const metadataPromises = Array.from(docsByCategory.keys()).map(async (category) => {
                // Get a sample doc from this category to determine path
                const sampleDoc = docsByCategory.get(category)[0];
                const metadata = await getCategoryMetadata(sampleDoc.path, siteDir, docsDir);
                categoryMetadataMap.set(category, metadata);
            });
            await Promise.all(metadataPromises);
        }
        const sortedCategories = Array.from(docsByCategory.keys()).sort((a, b) => {
            // If we have position data, sort by position first
            if (categoryMetadataMap.has(a) && categoryMetadataMap.has(b)) {
                const metaA = categoryMetadataMap.get(a);
                const metaB = categoryMetadataMap.get(b);
                if (metaA.position !== metaB.position) {
                    return metaA.position - metaB.position;
                }
            }
            // Fallback to alphabetical sorting
            return a.localeCompare(b);
        });
        // Generate sections for each category (async to read subdirectory metadata)
        const categorySectionsPromises = sortedCategories.map(async (category) => {
            const categoryDocs = docsByCategory.get(category);
            // Group documents by subdirectory
            const docsBySubdir = new Map();
            const subdirPathMap = new Map(); // Map subdir name to full path
            for (const doc of categoryDocs) {
                const subdir = docsDir ? extractSubdirectoryFromPath(doc.path, docsDir) : null;
                if (!docsBySubdir.has(subdir)) {
                    docsBySubdir.set(subdir, []);
                }
                docsBySubdir.get(subdir).push(doc);
                // Collect subdirectory paths for metadata reading (only once per subdir)
                if (subdir && siteDir && docsDir && !subdirPathMap.has(subdir)) {
                    const pathParts = doc.path.replace(/^\/+|\/+$/g, '').replace(/\.mdx?$/, '').split('/');
                    // For subdirectories, we need at least 5 parts: docs/sdk/category/subdir/file
                    if (pathParts.length >= 5 && pathParts[0] === docsDir) {
                        const subdirPath = path.join(siteDir, pathParts.slice(0, 4).join('/'));
                        subdirPathMap.set(subdir, subdirPath);
                    }
                }
            }
            // Read subdirectory metadata
            const subdirMetadataMap = new Map();
            if (siteDir && docsDir && subdirPathMap.size > 0) {
                const metadataPromises = Array.from(subdirPathMap.entries()).map(async ([subdirName, subdirPath]) => {
                    const metadata = await readCategoryMetadata(subdirPath);
                    if (metadata) {
                        subdirMetadataMap.set(subdirName, metadata);
                    }
                });
                await Promise.all(metadataPromises);
            }
            // Use label from _category_.json if available, otherwise use formatted category name
            const metadata = categoryMetadataMap.get(category);
            const categoryTitle = metadata?.label || formatCategoryName(category);
            const sections = [];
            // Process root-level documents (no subdirectory)
            const rootDocs = docsBySubdir.get(null) || [];
            if (rootDocs.length > 0) {
                const sortedRootDocs = sortDocsByPosition(rootDocs);
                const rootItems = sortedRootDocs.map(doc => generateLinkItem(doc, includeDescriptionInLinks));
                sections.push(rootItems.join('\n'));
            }
            // Process subdirectories
            const subdirs = Array.from(docsBySubdir.keys()).filter(s => s !== null);
            // Sort subdirectories by position from _category_.json, then alphabetically
            subdirs.sort((a, b) => {
                const metaA = subdirMetadataMap.get(a);
                const metaB = subdirMetadataMap.get(b);
                if (metaA && metaB) {
                    if (metaA.position !== metaB.position) {
                        return metaA.position - metaB.position;
                    }
                }
                // Fallback to alphabetical sorting
                return a.localeCompare(b);
            });
            for (const subdir of subdirs) {
                const subdirDocs = docsBySubdir.get(subdir);
                const sortedSubdirDocs = sortDocsByPosition(subdirDocs);
                // Get subdirectory label from metadata or use formatted name
                const subdirMetadata = subdirMetadataMap.get(subdir);
                const subdirTitle = subdirMetadata?.label || formatCategoryName(subdir);
                const subdirItems = sortedSubdirDocs.map(doc => generateLinkItem(doc, includeDescriptionInLinks));
                sections.push(`### ${subdirTitle}\n\n${subdirItems.join('\n')}`);
            }
            return `## ${categoryTitle}\n\n${sections.join('\n\n')}`;
        });
        const categorySections = await Promise.all(categorySectionsPromises);
        // Use custom root content or default message
        const rootContent = customRootContent || 'This file contains links to documentation sections following the llmstxt.org standard.';
        const llmFileContent = (0, utils_1.createMarkdownContent)(fileTitle, `${fileDescription}${versionInfo}`, `${rootContent}\n\n${categorySections.join('\n\n')}`, true // include metadata (description)
        );
        await (0, utils_1.writeFile)(outputPath, llmFileContent);
    }
    console.log(`Generated: ${outputPath}`);
}
/**
 * Generate individual markdown files for each document
 * @param docs - Processed document information
 * @param outputDir - Directory to write the markdown files
 * @param siteUrl - Base site URL
 * @param docsDir - The configured docs directory name (e.g., 'docs', 'documentation', etc.)
 * @param keepFrontMatter - Array of frontmatter keys to preserve in generated files
 * @returns Updated docs with new URLs pointing to generated markdown files
 */
async function generateIndividualMarkdownFiles(docs, outputDir, siteUrl, docsDir = 'docs', keepFrontMatter = []) {
    const updatedDocs = [];
    const usedPaths = new Set();
    for (const doc of docs) {
        // Use the original path structure as default filename.
        let relativePath = doc.path
            .replace(/^\/+/, '') // Remove leading slashes
            .replace(/\.mdx?$/, '.md'); // Ensure .md extension
        relativePath = relativePath
            .replace(new RegExp(`^${docsDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`), ''); // Remove configured docs dir prefix
        // If frontmatter has slug, use that.
        if (doc.frontMatter?.slug) {
            const pathParts = relativePath.replace(/\.md$/, '').split('/');
            pathParts[pathParts.length - 1] = doc.frontMatter.slug.replace(/^\/+|\/+$/g, '');
            relativePath = pathParts.join('/') + '.md';
        }
        // Otherwise, if frontmatter has id, use that.
        else if (doc.frontMatter?.id) {
            const pathParts = relativePath.replace(/\.md$/, '').split('/');
            pathParts[pathParts.length - 1] = doc.frontMatter.id;
            relativePath = pathParts.join('/') + '.md';
        }
        // If path is empty or invalid, create a fallback path
        if (!relativePath || relativePath === '.md') {
            const sanitizedTitle = (0, utils_1.sanitizeForFilename)(doc.title, 'untitled');
            relativePath = `${sanitizedTitle}.md`;
        }
        // Ensure path uniqueness
        let uniquePath = relativePath;
        let counter = 1;
        while (usedPaths.has(uniquePath.toLowerCase())) {
            counter++;
            const pathParts = relativePath.split('.');
            const extension = pathParts.pop() || 'md';
            const basePath = pathParts.join('.');
            uniquePath = `${basePath}-${counter}.${extension}`;
        }
        usedPaths.add(uniquePath.toLowerCase());
        // Create the full file path and ensure directory exists
        const fullPath = path.join(outputDir, uniquePath);
        const directory = path.dirname(fullPath);
        // Create directory structure if it doesn't exist
        await fs.mkdir(directory, { recursive: true });
        // Extract preserved frontmatter if specified
        let preservedFrontMatter = {};
        if (keepFrontMatter.length > 0 && doc.frontMatter) {
            for (const key of keepFrontMatter) {
                if (key in doc.frontMatter) {
                    preservedFrontMatter[key] = doc.frontMatter[key];
                }
            }
        }
        // Create markdown content using the utility function
        const markdownContent = (0, utils_1.createMarkdownContent)(doc.title, doc.description, doc.content, true, // includeMetadata
        Object.keys(preservedFrontMatter).length > 0 ? preservedFrontMatter : undefined);
        // Write the markdown file
        await (0, utils_1.writeFile)(fullPath, markdownContent);
        // Create updated DocInfo with new URL pointing to the generated markdown file
        // Convert file path to URL path (use forward slashes)
        const urlPath = uniquePath.replace(/\\/g, '/');
        const newUrl = `${siteUrl}/${urlPath}`;
        updatedDocs.push({
            ...doc,
            url: newUrl,
            path: `/${urlPath}` // Update path to the new markdown file
        });
        console.log(`Generated markdown file: ${uniquePath}`);
    }
    return updatedDocs;
}
/**
 * Generate standard LLM files (llms.txt and llms-full.txt)
 * @param context - Plugin context
 * @param allDocFiles - Array of all document files
 */
async function generateStandardLLMFiles(context, allDocFiles) {
    const { outDir, siteDir, siteUrl, docsDir, docTitle, docDescription, options } = context;
    const { generateLLMsTxt, generateLLMsFullTxt, llmsTxtFilename = 'llms.txt', llmsFullTxtFilename = 'llms-full.txt', includeOrder = [], includeUnmatchedLast = true, version, generateMarkdownFiles = false, rootContent, fullRootContent, includeDescriptionInLinks = true } = options;
    if (!generateLLMsTxt && !generateLLMsFullTxt) {
        return;
    }
    // Process files for the standard outputs
    let processedDocs = await (0, processor_1.processFilesWithPatterns)(context, allDocFiles, [], // No specific include patterns - include all
    [], // No additional ignore patterns beyond global ignoreFiles
    includeOrder, includeUnmatchedLast);
    console.log(`Processed ${processedDocs.length} documentation files for standard LLM files`);
    // Generate individual markdown files if requested
    if (generateMarkdownFiles && processedDocs.length > 0) {
        console.log('Generating individual markdown files...');
        processedDocs = await generateIndividualMarkdownFiles(processedDocs, outDir, siteUrl, context.docsDir, context.options.keepFrontMatter || []);
    }
    // Generate llms.txt
    if (generateLLMsTxt) {
        const llmsTxtPath = path.join(outDir, llmsTxtFilename);
        await generateLLMFile(processedDocs, llmsTxtPath, docTitle, docDescription, false, // links only
        version, rootContent, siteDir, docsDir, includeDescriptionInLinks);
    }
    // Generate llms-full.txt
    if (generateLLMsFullTxt) {
        const llmsFullTxtPath = path.join(outDir, llmsFullTxtFilename);
        await generateLLMFile(processedDocs, llmsFullTxtPath, docTitle, docDescription, true, // full content
        version, fullRootContent, siteDir, docsDir, includeDescriptionInLinks);
    }
}
/**
 * Generate custom LLM files based on configuration
 * @param context - Plugin context
 * @param allDocFiles - Array of all document files
 */
async function generateCustomLLMFiles(context, allDocFiles) {
    const { outDir, siteDir, siteUrl, docsDir, docTitle, docDescription, options } = context;
    const { customLLMFiles = [], ignoreFiles = [], generateMarkdownFiles = false, includeDescriptionInLinks = true } = options;
    if (customLLMFiles.length === 0) {
        return;
    }
    console.log(`Generating ${customLLMFiles.length} custom LLM files...`);
    for (const customFile of customLLMFiles) {
        console.log(`Processing custom file: ${customFile.filename}, version: ${customFile.version || 'undefined'}`);
        // Combine global ignores with custom ignores
        const combinedIgnores = [...ignoreFiles];
        if (customFile.ignorePatterns) {
            combinedIgnores.push(...customFile.ignorePatterns);
        }
        // Process files according to the custom configuration
        let customDocs = await (0, processor_1.processFilesWithPatterns)(context, allDocFiles, customFile.includePatterns, combinedIgnores, customFile.orderPatterns || [], customFile.includeUnmatchedLast ?? false);
        if (customDocs.length > 0) {
            // Generate individual markdown files if requested
            if (generateMarkdownFiles) {
                console.log(`Generating individual markdown files for custom file: ${customFile.filename}...`);
                customDocs = await generateIndividualMarkdownFiles(customDocs, outDir, siteUrl, context.docsDir, context.options.keepFrontMatter || []);
            }
            // Use custom title/description or fall back to defaults
            const customTitle = customFile.title || docTitle;
            const customDescription = customFile.description || docDescription;
            // Generate the custom LLM file
            const customFilePath = path.join(outDir, customFile.filename);
            await generateLLMFile(customDocs, customFilePath, customTitle, customDescription, customFile.fullContent, customFile.version, customFile.rootContent, siteDir, docsDir, includeDescriptionInLinks);
            console.log(`Generated custom LLM file: ${customFile.filename} with ${customDocs.length} documents`);
        }
        else {
            console.warn(`No matching documents found for custom LLM file: ${customFile.filename}`);
        }
    }
}
/**
 * Collect all document files from docs directory and optionally blog
 * Note: This function is only called for the default locale build,
 * as non-default locales are filtered out in postBuild hook
 * @param context - Plugin context
 * @returns Array of file paths
 */
async function collectDocFiles(context) {
    const { siteDir, docsDir, options } = context;
    const { ignoreFiles = [], includeBlog = false } = options;
    const allDocFiles = [];
    // Process docs directory
    const fullDocsDir = path.join(siteDir, docsDir);
    try {
        await fs.access(fullDocsDir);
        // Collect all markdown files from docs directory
        const docFiles = await (0, utils_1.readMarkdownFiles)(fullDocsDir, siteDir, ignoreFiles);
        allDocFiles.push(...docFiles);
    }
    catch (err) {
        console.warn(`Docs directory not found: ${fullDocsDir}`);
    }
    // Process blog if enabled
    if (includeBlog) {
        const blogDir = path.join(siteDir, 'blog');
        try {
            await fs.access(blogDir);
            // Collect all markdown files from blog directory
            const blogFiles = await (0, utils_1.readMarkdownFiles)(blogDir, siteDir, ignoreFiles);
            allDocFiles.push(...blogFiles);
        }
        catch (err) {
            console.warn(`Blog directory not found: ${blogDir}`);
        }
    }
    return allDocFiles;
}
