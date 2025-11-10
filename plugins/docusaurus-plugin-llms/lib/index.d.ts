/**
 * @fileoverview Docusaurus plugin that generates LLM-friendly documentation following the llmstxt.org standard.
 *
 * This plugin creates two files:
 * - llms.txt: Contains links to all sections of documentation
 * - llms-full.txt: Contains all documentation content in a single file
 *
 * The plugin runs during the Docusaurus build process and scans all Markdown files in the docs directory.
 */
import type { LoadContext, Plugin } from '@docusaurus/types';
import { PluginOptions } from './types';
/**
 * A Docusaurus plugin to generate LLM-friendly documentation following
 * the llmstxt.org standard
 *
 * @param context - Docusaurus context
 * @param options - Plugin options
 * @returns Plugin object
 */
export default function docusaurusPluginLLMs(context: LoadContext, options?: PluginOptions): Plugin<void>;
export type { PluginOptions };
