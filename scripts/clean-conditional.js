#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
  rootPath: null // 初始化为 null
};

// 寻找 --root-path 参数
const rootPathIndex = args.indexOf('--root-path');
if (rootPathIndex !== -1 && rootPathIndex + 1 < args.length) {
  options.rootPath = args[rootPathIndex + 1];
}

// 如果使用--help选项，显示帮助信息
if (options.help) {
  console.log(chalk.bold('\n处理 MDX 文件中的条件标签\n'));
  console.log('用法:');
  console.log(`  ${chalk.cyan('node scripts/clean-conditional.js')} [选项] [文件路径...]\n`);
  console.log('说明:');
  console.log(`  处理 MDX 文件中的各种条件标签，根据规则删除或保留内容。\n`);
  console.log('功能:');
  console.log(`  ${chalk.cyan('1.')} 删除 ${chalk.yellow('<Conditional brand="leancloud">')} 标签及其包裹的内容`);
  console.log(`  ${chalk.cyan('2.')} 保留 ${chalk.yellow('<Conditional brand="tds">')} 标签中的内容，但删除标签本身`);
  console.log(`  ${chalk.cyan('3.')} 在 ${chalk.yellow('cn')} 目录下删除 ${chalk.yellow('<Conditional region="global">')} 标签及其内容，保留 ${chalk.yellow('<Conditional region="cn">')} 内容`);
  console.log(`  ${chalk.cyan('4.')} 在 ${chalk.yellow('hk')} 目录下删除 ${chalk.yellow('<Conditional region="cn">')} 标签及其内容，保留 ${chalk.yellow('<Conditional region="global">')} 内容\n`);
  console.log('参数:');
  console.log(`  ${chalk.yellow('[文件路径...]')}   指定要处理的文件，可以使用通配符。如果未提供，将处理所有 MDX 文件。\n`);
  console.log('选项:');
  console.log(`  ${chalk.yellow('--dry-run')}        显示将要修改的内容但不实际修改文件`);
  console.log(`  ${chalk.yellow('--help, -h')}       显示此帮助信息`);
  console.log(`  ${chalk.yellow('--root-path [路径]')} 指定根路径，用于确定文件所属区域`);
  console.log('  ');
  process.exit(0);
}

// 主函数
async function main() {
  console.log(chalk.cyan('正在处理 MDX 文件中的条件标签...'));
  let mdxFiles = args.filter(arg => !arg.startsWith('--') && arg !== args[rootPathIndex + 1]);
  
  // 如果没有指定文件，则查找所有 MDX 文件
  if (mdxFiles.length === 0) {
    mdxFiles = await findAllMdxFiles();
  }
  
  let totalFound = 0;
  let totalModified = 0;
  let totalLeancloudBlocks = 0;
  let totalTdsBlocks = 0;
  let totalRegionBlocks = 0;

  for (const file of mdxFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      let newContent = content;
      let fileModified = false;
      let fileLeancloudBlocks = 0;
      let fileTdsBlocks = 0;
      let fileRegionBlocks = 0;
      
      // 确定文件所属目录（cn 或 hk）
      const fileRegion = determineFileRegion(file, options.rootPath);
      const isCnDir = fileRegion === 'cn';
      const isHkDir = fileRegion === 'hk';
      
      // 变更处理顺序：先处理 LeanCloud 标签，再处理区域标签，最后处理 TDS 标签
      
      // 1. 处理 LeanCloud 标签（完全删除）
      const leancloudMatches = findConditionalBlocks(newContent, 'brand="leancloud"');
      if (leancloudMatches.length > 0) {
        fileLeancloudBlocks = leancloudMatches.length;
        totalLeancloudBlocks += fileLeancloudBlocks;
        
        if (!fileModified) {
          fileModified = true;
          totalFound++;
          console.log(chalk.cyan(`\n文件: ${chalk.bold(file)}`));
        }
        
        console.log(chalk.yellow(`找到 ${chalk.bold(fileLeancloudBlocks)} 个 LeanCloud 条件块`));
        
        if (options.dryRun) {
          for (const match of leancloudMatches) {
            console.log(chalk.yellow('将删除以下内容:'));
            console.log(chalk.gray('-'.repeat(80)));
            console.log(chalk.yellow(match));
            console.log(chalk.gray('-'.repeat(80)));
          }
        }
        
        // 删除 LeanCloud 条件块
        newContent = removeConditionalBlocks(newContent, 'brand="leancloud"');
      }
      
      // 2. 处理区域条件标签
      if (isCnDir || isHkDir) {
        // 在 cn 目录下，删除 <Conditional region="global"> 标签及其内容
        // 在 hk 目录下，删除 <Conditional region="cn"> 标签及其内容
        const regionToDelete = isCnDir ? 'region="global"' : 'region="cn"';
        const regionName = isCnDir ? '全局区域' : 'CN 区域';
        
        const regionDeleteMatches = findConditionalBlocks(newContent, regionToDelete);
        if (regionDeleteMatches.length > 0) {
          fileRegionBlocks += regionDeleteMatches.length;
          totalRegionBlocks += regionDeleteMatches.length;
          
          if (!fileModified) {
            fileModified = true;
            totalFound++;
            console.log(chalk.cyan(`\n文件: ${chalk.bold(file)}`));
          }
          
          console.log(chalk.magenta(`找到 ${chalk.bold(regionDeleteMatches.length)} 个 ${regionName}条件块`));
          
          if (options.dryRun) {
            for (const match of regionDeleteMatches) {
              console.log(chalk.magenta('将删除以下内容:'));
              console.log(chalk.gray('-'.repeat(80)));
              console.log(chalk.magenta(match));
              console.log(chalk.gray('-'.repeat(80)));
            }
          } else {
            // 删除区域条件块
            newContent = removeConditionalBlocks(newContent, regionToDelete);
          }
        }
        
        // 在 cn 目录下，保留 <Conditional region="cn"> 标签中的内容
        // 在 hk 目录下，保留 <Conditional region="global"> 标签中的内容
        const regionToKeep = isCnDir ? 'region="cn"' : 'region="global"';
        const keepRegionName = isCnDir ? 'CN' : '全局';
        
        const regionKeepMatches = findConditionalBlocks(newContent, regionToKeep);
        if (regionKeepMatches.length > 0) {
          fileRegionBlocks += regionKeepMatches.length;
          
          if (!fileModified) {
            fileModified = true;
            totalFound++;
            console.log(chalk.cyan(`\n文件: ${chalk.bold(file)}`));
          }
          
          console.log(chalk.cyan(`找到 ${chalk.bold(regionKeepMatches.length)} 个 ${keepRegionName} 区域条件块`));
          
          if (options.dryRun) {
            for (const match of regionKeepMatches) {
              const innerContent = extractInnerContent(match);
              console.log(chalk.cyan('将把:'));
              console.log(chalk.gray('-'.repeat(80)));
              console.log(chalk.cyan(match));
              console.log(chalk.gray('-'.repeat(80)));
              console.log(chalk.cyan('替换为:'));
              console.log(chalk.gray('-'.repeat(80)));
              console.log(chalk.green(innerContent));
              console.log(chalk.gray('-'.repeat(80)));
            }
          }
          
          // 替换区域条件块，保留内容
          newContent = keepConditionalContent(newContent, regionToKeep);
        }
      }
      
      // 3. 处理 TDS 标签（保留内容）
      const tdsMatches = findConditionalBlocks(newContent, 'brand="tds"');
      if (tdsMatches.length > 0) {
        fileTdsBlocks = tdsMatches.length;
        totalTdsBlocks += fileTdsBlocks;
        
        if (!fileModified) {
          fileModified = true;
          totalFound++;
          console.log(chalk.cyan(`\n文件: ${chalk.bold(file)}`));
        }
        
        console.log(chalk.blue(`找到 ${chalk.bold(fileTdsBlocks)} 个 TDS 条件块`));
        
        if (options.dryRun) {
          for (const match of tdsMatches) {
            const innerContent = extractInnerContent(match);
            console.log(chalk.blue('将把:'));
            console.log(chalk.gray('-'.repeat(80)));
            console.log(chalk.blue(match));
            console.log(chalk.gray('-'.repeat(80)));
            console.log(chalk.blue('替换为:'));
            console.log(chalk.gray('-'.repeat(80)));
            console.log(chalk.green(innerContent));
            console.log(chalk.gray('-'.repeat(80)));
          }
        }
        
        // 替换 TDS 条件块，保留内容
        newContent = keepConditionalContent(newContent, 'brand="tds"');
      }
      
      // 修复处理后可能存在的空闭合标签问题
      newContent = fixUnmatchedTags(newContent);
      
      // 修复空行问题 - 删除连续3个以上的空行
      newContent = fixEmptyLines(newContent);
      
      // 执行修改操作
      if (fileModified && content !== newContent) {
        if (!options.dryRun) {
          await fs.writeFile(file, newContent);
          totalModified++;
          console.log(chalk.green('✓ 已修改'));
        } else {
          console.log(chalk.yellow('🔍 干运行模式 - 未实际修改文件'));
        }
      } else if (fileModified) {
        console.log(chalk.blue('ℹ 内容无变化'));
      }
    } catch (error) {
      console.error(chalk.red(`处理文件 ${file} 时出错:`), error);
    }
  }

  if (options.dryRun) {
    console.log(chalk.yellow('\n试运行完成，找到 ' + chalk.bold(totalFound) + ' 个包含条件标签的文件'));
  } else {
    console.log(chalk.green('\n操作完成，已修改 ' + chalk.bold(totalModified) + ' 个文件'));
  }
  
  if (totalFound > 0) {
    console.log(`其中 LeanCloud 条件块: ${chalk.bold(totalLeancloudBlocks)}，TDS 条件块: ${chalk.bold(totalTdsBlocks)}，区域条件块: ${chalk.bold(totalRegionBlocks)}`);
  }

  if (totalFound === 0) {
    console.log(chalk.blue('未找到需要处理的条件标签。'));
  }
}

async function findAllMdxFiles() {
  return await glob.glob('**/*.mdx', {
    ignore: ['**/node_modules/**', '**/build/**', '**/.docusaurus/**'],
  });
}

// 新增帮助函数，用于以更智能的方式处理条件标签

// 查找条件标签块
function findConditionalBlocks(content, attribute) {
  const blocks = [];
  // 修改正则表达式以同时匹配单引号和双引号的属性
  const attrName = attribute.split('=')[0];
  const attrValue = attribute.split('=')[1].replace(/['"]/g, '');
  // 匹配 attribute="value" 或 attribute='value'
  const regex = new RegExp(`<Conditional[^>]*${attrName}=['"]${attrValue}['"][^>]*>[\\s\\S]*?<\\/Conditional>`, 'g');
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[0]);
  }
  
  return blocks;
}

// 提取条件标签内容
function extractInnerContent(block) {
  const openTagLength = block.indexOf('>') + 1;
  const closeTagIndex = block.lastIndexOf('</Conditional>');
  
  if (closeTagIndex > openTagLength) {
    return block.substring(openTagLength, closeTagIndex);
  }
  
  return '';
}

// 删除条件标签及内容
function removeConditionalBlocks(content, attribute) {
  // 采用更彻底的方法解决嵌套问题
  let newContent = content;
  
  // 提取属性名和值，忽略引号
  const attrName = attribute.split('=')[0];
  const attrValue = attribute.split('=')[1].replace(/['"]/g, '');
  
  // 1. 首先标记所有需要删除的块的起始位置
  // 匹配 attribute="value" 或 attribute='value'
  const startRegex = new RegExp(`<Conditional[^>]*${attrName}=['"]${attrValue}['"][^>]*>`, 'g');
  const startPositions = [];
  let startMatch;
  while ((startMatch = startRegex.exec(newContent)) !== null) {
    startPositions.push(startMatch.index);
  }
  
  // 倒序处理，避免位置变化
  for (let i = startPositions.length - 1; i >= 0; i--) {
    const startPos = startPositions[i];
    
    // 从开始位置寻找匹配的结束标签
    let openTags = 1;
    let endPos = startPos;
    let currentPos = startPos + 1;
    
    // 扫描后续内容寻找匹配的结束标签
    while (openTags > 0 && currentPos < newContent.length) {
      // 查找下一个开始或结束标签
      const nextStart = newContent.indexOf('<Conditional', currentPos);
      const nextEnd = newContent.indexOf('</Conditional>', currentPos);
      
      // 两者都没找到，结束扫描
      if (nextStart === -1 && nextEnd === -1) break;
      
      // 找到了一个开始标签
      if (nextStart !== -1 && (nextEnd === -1 || nextStart < nextEnd)) {
        openTags++;
        currentPos = nextStart + 1;
      } 
      // 找到了一个结束标签
      else if (nextEnd !== -1) {
        openTags--;
        currentPos = nextEnd + 1;
        if (openTags === 0) {
          endPos = nextEnd + '</Conditional>'.length;
        }
      }
    }
    
    if (openTags === 0) {
      // 删除整个块
      newContent = newContent.substring(0, startPos) + newContent.substring(endPos);
    }
  }
  
  return newContent;
}

// 保留条件标签内容
function keepConditionalContent(content, attribute) {
  // 同样使用上面的方法来处理嵌套，但保留内容
  let newContent = content;
  
  // 提取属性名和值，忽略引号
  const attrName = attribute.split('=')[0];
  const attrValue = attribute.split('=')[1].replace(/['"]/g, '');
  
  // 1. 标记所有需要保留内容的块的起始位置
  // 匹配 attribute="value" 或 attribute='value'
  const startRegex = new RegExp(`<Conditional[^>]*${attrName}=['"]${attrValue}['"][^>]*>`, 'g');
  const positions = [];
  let startMatch;
  
  while ((startMatch = startRegex.exec(newContent)) !== null) {
    positions.push({
      start: startMatch.index,
      tagEnd: startMatch.index + startMatch[0].length
    });
  }
  
  // 倒序处理，避免位置变化
  for (let i = positions.length - 1; i >= 0; i--) {
    const { start, tagEnd } = positions[i];
    
    // 从开始位置寻找匹配的结束标签
    let openTags = 1;
    let endPos = start;
    let contentStart = tagEnd;
    let currentPos = tagEnd;
    
    // 扫描后续内容寻找匹配的结束标签
    while (openTags > 0 && currentPos < newContent.length) {
      // 查找下一个开始或结束标签
      const nextStart = newContent.indexOf('<Conditional', currentPos);
      const nextEnd = newContent.indexOf('</Conditional>', currentPos);
      
      // 两者都没找到，结束扫描
      if (nextStart === -1 && nextEnd === -1) break;
      
      // 找到了一个开始标签
      if (nextStart !== -1 && (nextEnd === -1 || nextStart < nextEnd)) {
        openTags++;
        currentPos = nextStart + 1;
      } 
      // 找到了一个结束标签
      else if (nextEnd !== -1) {
        openTags--;
        currentPos = nextEnd + 1;
        if (openTags === 0) {
          // 找到匹配的结束标签
          const contentEnd = nextEnd;
          const endTagLength = '</Conditional>'.length;
          
          // 提取内容并替换整个块
          const content = newContent.substring(contentStart, contentEnd);
          newContent = newContent.substring(0, start) + content + newContent.substring(nextEnd + endTagLength);
        }
      }
    }
  }
  
  return newContent;
}

// 修复未匹配的标签
function fixUnmatchedTags(content) {
  // 最简单但有效的方法：完全移除所有标签，保留内容
  // 由于在调用此函数前，已经处理过需要保留和删除的内容
  // 此时任何剩余的标签都是多余的，可以安全删除
  return content
    .replace(/<Conditional[^>]*>/g, '')
    .replace(/<\/Conditional>/g, '');
}

// 修复空行问题 - 删除连续3个以上的空行
function fixEmptyLines(content) {
  return content.replace(/\n{4,}/g, '\n\n\n');
}

// 确定文件所属目录（cn 或 hk）
function determineFileRegion(file, rootPath) {
  if (rootPath) {
    // 如果提供了根路径，计算相对路径
    const absoluteFile = path.resolve(file);
    const absoluteRoot = path.resolve(rootPath);
    
    // 获取相对于根路径的路径
    let relativePath;
    try {
      relativePath = path.relative(absoluteRoot, absoluteFile);
    } catch (e) {
      // 如果计算相对路径出错，回退到默认逻辑
      console.warn(`无法计算相对路径，使用默认逻辑: ${e.message}`);
      return file.startsWith('cn/') ? 'cn' : (file.startsWith('hk/') ? 'hk' : null);
    }
    
    // 检查相对路径的第一个目录
    const firstDir = relativePath.split(path.sep)[0];
    return firstDir === 'cn' ? 'cn' : (firstDir === 'hk' ? 'hk' : null);
  } else {
    // 默认逻辑
    return file.startsWith('cn/') ? 'cn' : (file.startsWith('hk/') ? 'hk' : null);
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
}); 