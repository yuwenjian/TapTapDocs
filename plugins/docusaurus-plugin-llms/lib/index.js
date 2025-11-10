"use strict";
/**
 * @fileoverview Docusaurus plugin that generates LLM-friendly documentation following the llmstxt.org standard.
 *
 * This plugin creates two files:
 * - llms.txt: Contains links to all sections of documentation
 * - llms-full.txt: Contains all documentation content in a single file
 *
 * The plugin runs during the Docusaurus build process and scans all Markdown files in the docs directory.
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
exports.default = docusaurusPluginLLMs;
const path = __importStar(require("path"));
const generator_1 = require("./generator");
/**
 * Detect the current locale being built from various sources
 * @param siteConfig - Docusaurus site configuration
 * @param outDir - Output directory path
 * @param props - PostBuild props (may contain locale info)
 * @returns The detected locale code, or undefined if i18n is not configured
 */
function detectCurrentLocale(siteConfig, outDir, props) {
    const i18n = siteConfig.i18n;
    if (!i18n) {
        return undefined;
    }
    const locales = i18n.locales || [];
    const defaultLocale = i18n.defaultLocale;
    // Method 1: Check if props has locale information
    // Note: Docusaurus Props type doesn't expose locale, so we check dynamically
    const propsWithLocale = props;
    const propsLocale = propsWithLocale?.locale || propsWithLocale?.currentLocale;
    if (propsLocale && locales.includes(propsLocale)) {
        return propsLocale;
    }
    // Method 2: Infer from routes - check if routes start with a locale prefix
    if (props?.routes && Array.isArray(props.routes)) {
        const firstRoute = props.routes[0];
        if (firstRoute?.path) {
            const pathParts = firstRoute.path.split('/').filter(Boolean);
            if (pathParts.length > 0 && locales.includes(pathParts[0])) {
                return pathParts[0];
            }
        }
    }
    // Method 3: Infer from outDir path
    // If the last part of outDir is a locale code, it's that locale
    // Otherwise, it's the default locale (default locale builds to the base outDir)
    const outDirParts = outDir.split(path.sep);
    const lastPart = outDirParts[outDirParts.length - 1];
    if (locales.includes(lastPart)) {
        return lastPart;
    }
    // Default to default locale if no locale-specific path detected
    return defaultLocale;
}
/**
 * A Docusaurus plugin to generate LLM-friendly documentation following
 * the llmstxt.org standard
 *
 * @param context - Docusaurus context
 * @param options - Plugin options
 * @returns Plugin object
 */
function docusaurusPluginLLMs(context, options = {}) {
    // Set default options
    const { generateLLMsTxt = true, generateLLMsFullTxt = true, docsDir = 'docs', ignoreFiles = [], title, description, llmsTxtFilename = 'llms.txt', llmsFullTxtFilename = 'llms-full.txt', includeBlog = false, pathTransformation, includeOrder = [], includeUnmatchedLast = true, customLLMFiles = [], excludeImports = false, removeDuplicateHeadings = false, generateMarkdownFiles = false, keepFrontMatter = [], rootContent, fullRootContent, includeDescriptionInLinks = true, } = options;
    const { siteDir, siteConfig, outDir, } = context;
    // Build the site URL with proper trailing slash
    const siteUrl = siteConfig.url + (siteConfig.baseUrl.endsWith('/')
        ? siteConfig.baseUrl.slice(0, -1)
        : siteConfig.baseUrl || '');
    // Get default locale from i18n config
    const defaultLocale = siteConfig.i18n?.defaultLocale;
    // Create a plugin context object with processed options
    const pluginContext = {
        siteDir,
        outDir,
        siteUrl,
        docsDir,
        docTitle: title || siteConfig.title,
        docDescription: description || siteConfig.tagline || '',
        defaultLocale,
        options: {
            generateLLMsTxt,
            generateLLMsFullTxt,
            docsDir,
            ignoreFiles,
            title,
            description,
            llmsTxtFilename,
            llmsFullTxtFilename,
            includeBlog,
            pathTransformation,
            includeOrder,
            includeUnmatchedLast,
            customLLMFiles,
            excludeImports,
            removeDuplicateHeadings,
            generateMarkdownFiles,
            keepFrontMatter,
            rootContent,
            fullRootContent,
            includeDescriptionInLinks,
        }
    };
    return {
        name: 'docusaurus-plugin-llms',
        /**
         * Generates LLM-friendly documentation files after the build is complete
         * Only generates for the default locale to avoid duplicate content for AI
         */
        async postBuild(props) {
            // Check if current build is for default locale
            // Docusaurus builds each locale separately, so we need to detect which locale is being built
            const currentLocale = detectCurrentLocale(siteConfig, outDir, props);
            // Only generate llms.txt for default locale
            if (currentLocale && defaultLocale && currentLocale !== defaultLocale) {
                return;
            }
            try {
                let enhancedContext = pluginContext;
                // If props are provided (Docusaurus 3.x+), use the resolved routes
                if (props?.routes) {
                    // Create a map of file paths to their resolved URLs
                    const routeMap = new Map();
                    // Helper function to recursively process routes
                    const processRoutes = (routes) => {
                        routes.forEach(route => {
                            if (route.path) {
                                // Store the actual resolved path
                                routeMap.set(route.path, route.path);
                            }
                            // Process nested routes recursively
                            if (route.routes) {
                                processRoutes(route.routes);
                            }
                        });
                    };
                    // Process all routes (cast to RouteConfig[] for recursive processing)
                    processRoutes(props.routes);
                    // Pass the resolved routes to the plugin context
                    enhancedContext = {
                        ...pluginContext,
                        routesPaths: props.routesPaths,
                        routes: props.routes,
                        routeMap,
                    };
                }
                // Collect all document files
                const allDocFiles = await (0, generator_1.collectDocFiles)(enhancedContext);
                // Skip further processing if no documents were found
                if (allDocFiles.length === 0) {
                    console.warn('No documents found to process.');
                    return;
                }
                // Process standard LLM files (llms.txt and llms-full.txt)
                await (0, generator_1.generateStandardLLMFiles)(enhancedContext, allDocFiles);
                // Process custom LLM files
                await (0, generator_1.generateCustomLLMFiles)(enhancedContext, allDocFiles);
                // Output overall statistics
                console.log(`Stats: ${allDocFiles.length} total available documents processed`);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error('Error generating LLM documentation:', errorMessage);
                if (err instanceof Error && err.stack) {
                    console.error(err.stack);
                }
            }
        },
    };
}
