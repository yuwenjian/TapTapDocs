#!/usr/bin/env node
/**
 * 构建后处理脚本：注入搜索索引预加载标签
 * 
 * 扫描构建目录中的搜索索引文件，将 <link rel="preload"> 注入到所有 HTML 文件
 * 
 * 用法：node scripts/inject-search-preload.js <build-dir>
 * 示例：node scripts/inject-search-preload.js cn/build
 */

const fs = require('fs');
const path = require('path');

const buildDir = process.argv[2];
if (!buildDir) {
    console.error('用法: node scripts/inject-search-preload.js <build-dir>');
    process.exit(1);
}

const buildPath = path.resolve(buildDir);
if (!fs.existsSync(buildPath)) {
    console.error(`目录不存在: ${buildPath}`);
    process.exit(1);
}

/**
 * 递归查找文件
 */
function findFiles(dir, pattern, results = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findFiles(filePath, pattern, results);
        } else if (pattern.test(file)) {
            results.push(filePath);
        }
    }
    return results;
}

/**
 * 获取相对于 HTML 文件的索引路径
 */
function getRelativeIndexPath(htmlPath, indexPath, buildPath) {
    const htmlDir = path.dirname(htmlPath);
    // 计算从 HTML 文件到索引文件的相对路径
    let relativePath = path.relative(htmlDir, indexPath);
    // 确保使用正斜杠
    relativePath = relativePath.replace(/\\/g, '/');
    // 如果不是以 ./ 或 ../ 开头，添加 ./
    if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

/**
 * 为 HTML 文件找到对应的搜索索引
 */
function findMatchingIndex(htmlPath, indexFiles, buildPath) {
    const htmlRelative = path.relative(buildPath, htmlPath);
    const htmlParts = htmlRelative.split(path.sep);
    
    // 确定 HTML 文件所在的版本/语言目录
    // 例如：en/v3/some/page/index.html -> 应该匹配 en/v3/search-index-xxx.json
    // 或者：v3/some/page/index.html -> 应该匹配 v3/search-index-xxx.json
    // 或者：some/page/index.html -> 应该匹配根目录的 search-index-xxx.json
    
    let bestMatch = null;
    let bestMatchDepth = -1;
    
    for (const indexPath of indexFiles) {
        const indexRelative = path.relative(buildPath, indexPath);
        const indexDir = path.dirname(indexRelative);
        const indexParts = indexDir === '.' ? [] : indexDir.split(path.sep);
        
        // 检查 HTML 路径是否以索引目录开头
        let matches = true;
        for (let i = 0; i < indexParts.length; i++) {
            if (htmlParts[i] !== indexParts[i]) {
                matches = false;
                break;
            }
        }
        
        if (matches && indexParts.length > bestMatchDepth) {
            bestMatch = indexPath;
            bestMatchDepth = indexParts.length;
        }
    }
    
    return bestMatch;
}

/**
 * 注入预加载标签到 HTML
 */
function injectPreload(htmlPath, indexPath, buildPath) {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    
    // 检查是否已经注入过
    if (html.includes('search-index') && html.includes('rel="preload"')) {
        return false;
    }
    
    const relativePath = getRelativeIndexPath(htmlPath, indexPath, buildPath);
    const preloadTag = `<link rel="preload" href="${relativePath}" as="fetch" crossorigin="anonymous">`;
    
    // 在 </head> 前注入
    if (html.includes('</head>')) {
        html = html.replace('</head>', `${preloadTag}\n</head>`);
        fs.writeFileSync(htmlPath, html);
        return true;
    }
    
    return false;
}

// 主逻辑
const indexFiles = findFiles(buildPath, /search-index.*\.json$/);
if (indexFiles.length === 0) {
    process.exit(0);
}

const htmlFiles = findFiles(buildPath, /\.html$/);
for (const htmlPath of htmlFiles) {
    const indexPath = findMatchingIndex(htmlPath, indexFiles, buildPath);
    if (indexPath) {
        injectPreload(htmlPath, indexPath, buildPath);
    }
}
