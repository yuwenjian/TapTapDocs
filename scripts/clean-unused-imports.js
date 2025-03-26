#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  delete: args.includes('--delete') || args.includes('-d'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

// 如果使用--help选项，显示帮助信息
if (options.help) {
  console.log(chalk.bold('\n检查并清理 MDX 文件中未使用的导入\n'));
  console.log('用法:');
  console.log(`  ${chalk.cyan('node scripts/clean-unused-imports.js')} [选项]\n`);
  console.log('选项:');
  console.log(`  ${chalk.yellow('--delete, -d')}     自动删除未使用的导入`);
  console.log(`  ${chalk.yellow('--dry-run')}        与 --delete 一起使用，显示将要删除的内容但不实际修改文件`);
  console.log(`  ${chalk.yellow('--help, -h')}       显示此帮助信息`);
  console.log('  ');
  process.exit(0);
}

// 主函数
async function main() {
  console.log(chalk.cyan('正在检查MDX文件中未使用的导入...'));
  const unusedImportsResults = await checkUnusedImports();
  await processUnusedImports(unusedImportsResults);
}

async function findAllMdxFiles() {
  return await glob.glob('**/*.mdx', {
    ignore: ['**/node_modules/**', '**/build/**', '**/.docusaurus/**'],
  });
}

// 从文件内容中提取导入语句
function extractImports(content) {
  const imports = [];
  const regex = /import\s+(?:{([^}]+)}\s+from\s+['"]([^'"]+)['"]|([^;]+)\s+from\s+['"]([^'"]+)['"])/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const statement = match[0];

    if (match[1]) {
      // 处理命名导入: import { A, B as C } from 'module'
      const namedImports = match[1].split(',').map(imp => imp.trim());
      const modulePath = match[2];

      for (const namedImport of namedImports) {
        const aliasMatch = namedImport.match(/(\w+)(?:\s+as\s+(\w+))?/);
        if (aliasMatch) {
          const originalName = aliasMatch[1];
          const alias = aliasMatch[2] || originalName;
          imports.push({
            name: alias,
            originalName,
            type: 'named',
            modulePath,
            statement
          });
        }
      }
    } else if (match[3] && match[4]) {
      // 处理默认导入: import Name from 'module'
      const importName = match[3].trim();
      const modulePath = match[4];

      // 处理 import * as Name from 'module'
      const namespaceMatch = importName.match(/\*\s+as\s+(\w+)/);
      if (namespaceMatch) {
        imports.push({
          name: namespaceMatch[1],
          type: 'namespace',
          modulePath,
          statement
        });
      } else {
        imports.push({
          name: importName,
          type: 'default',
          modulePath,
          statement
        });
      }
    }
  }

  return imports;
}

// 检查导入是否被使用
function isImportUsed(content, importObj) {
  // 去除导入语句部分
  const contentWithoutImports = content.replace(/import\s+.+?from\s+['"].+?['"]/g, '');
  
  // 检查特定标签 <importName> 或 <importName />
  const tagPattern1 = new RegExp(`<${importObj.name}[\\s/>]`, 'i');
  const tagPattern2 = new RegExp(`<${importObj.name}>`, 'i');
  
  // 检查组件属性使用，如 component={importName}
  const propPattern = new RegExp(`component\\s*=\\s*{\\s*${importObj.name}\\s*}`, 'i');
  
  // 检查在JSX属性中的使用，如 prop={importName.something}
  const attrPattern = new RegExp(`\\{\\s*${importObj.name}\\.`, 'i');
  
  // 检查在JSX内部的使用，如 {importName}
  const jsxPattern = new RegExp(`\\{\\s*${importObj.name}\\s*\\}`, 'i');
  
  // 检查在JS代码中的使用，如 let x = importName
  const codePattern = new RegExp(`[^\\.]\\b${importObj.name}\\b`, 'i');
  
  // 正则模式合并
  return (
    tagPattern1.test(contentWithoutImports) ||
    tagPattern2.test(contentWithoutImports) ||
    propPattern.test(contentWithoutImports) ||
    attrPattern.test(contentWithoutImports) ||
    jsxPattern.test(contentWithoutImports) ||
    codePattern.test(contentWithoutImports)
  );
}

async function checkUnusedImports() {
  const mdxFiles = await findAllMdxFiles();
  const unusedImportsPerFile = [];

  for (const file of mdxFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const imports = extractImports(content);
      
      // 按照import语句进行分组
      const importsByStatement = {};
      for (const importObj of imports) {
        if (!importsByStatement[importObj.statement]) {
          importsByStatement[importObj.statement] = {
            statement: importObj.statement,
            imports: []
          };
        }
        importsByStatement[importObj.statement].imports.push(importObj);
      }
      
      const fullyUnusedStatements = [];
      
      // 检查每个导入语句是否完全未使用
      for (const [statement, data] of Object.entries(importsByStatement)) {
        const allImports = data.imports;
        const unusedImports = allImports.filter(importObj => !isImportUsed(content, importObj));
        
        // 只有当所有组件都未使用时，才将该语句添加到结果中
        if (unusedImports.length === allImports.length) {
          fullyUnusedStatements.push({
            statement,
            unused: unusedImports
          });
        }
      }
      
      if (fullyUnusedStatements.length > 0) {
        unusedImportsPerFile.push({
          file,
          unusedStatements: fullyUnusedStatements
        });
      }
    } catch (error) {
      console.error(chalk.red(`Error processing file ${file}:`), error);
    }
  }

  return unusedImportsPerFile;
}

async function removeUnusedImports(file, unusedImports) {
  try {
    // 读取文件内容
    let content = await fs.readFile(file, 'utf8');
    let originalContent = content;
    let modified = false;
    
    // 按照模块路径分组未使用的导入，方便进行智能清理
    const importsByStatement = {};
    for (const imp of unusedImports) {
      if (!importsByStatement[imp.statement]) {
        importsByStatement[imp.statement] = [];
      }
      importsByStatement[imp.statement].push(imp);
    }
    
    // 对每个导入语句进行处理
    for (const [statement, imps] of Object.entries(importsByStatement)) {
      // 获取全部导入信息
      const allImports = extractImports(statement);
      
      // 只有当导入语句中的所有组件都未使用时，才删除整个语句
      // 如果只是部分组件未使用，那么保留整个导入语句不变
      if (allImports.length === imps.length) {
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(statement)) {
            if (options.dryRun) {
              console.log(chalk.yellow(`将从 ${file} 的第 ${i + 1} 行删除: ${lines[i]}`));
            } else {
              lines[i] = '';  // 保留空行以保持行号一致
              modified = true;
            }
            break;
          }
        }
        
        content = lines.join('\n');
      }
      // 对于部分使用的导入，不做任何修改
    }
    
    if (!options.dryRun && modified) {
      await fs.writeFile(file, content);
      return true;
    }
    
    return modified;
  } catch (error) {
    console.error(chalk.red(`删除 ${file} 中的未使用导入时出错:`), error);
    return false;
  }
}

async function processUnusedImports(unusedImportsResults) {
  if (unusedImportsResults.length === 0) {
    console.log(chalk.green('未发现未使用的导入！'));
    return;
  }
  
  console.log(chalk.cyan(`\n在 ${chalk.bold(unusedImportsResults.length)} 个文件中发现未使用的导入`));
  
  let modifiedFilesCount = 0;
  
  for (const result of unusedImportsResults) {
    const fileInfo = chalk.cyan(`文件: ${chalk.bold(result.file)}\n未使用的导入:\n`);
    console.log(fileInfo);
    
    for (const unusedStatement of result.unusedStatements) {
      const importInfo = chalk.yellow(`  - ${unusedStatement.statement.trim()}\n`);
      console.log(importInfo);
    }
    
    console.log(''); // 空行分隔
    
    // 如果启用了删除选项，则删除未使用的导入
    if (options.delete) {
      // 将未使用的语句转换为可供removeUnusedImports使用的格式
      const unusedImports = result.unusedStatements.flatMap(stmt => stmt.unused);
      const modified = await removeUnusedImports(result.file, unusedImports);
      if (modified) {
        modifiedFilesCount++;
      }
    }
  }
  
  if (options.delete && !options.dryRun) {
    console.log(chalk.green(`\n已清理 ${chalk.bold(modifiedFilesCount)} 个文件中的未使用导入`));
  } else if (options.delete && options.dryRun) {
    console.log(chalk.yellow(`\n执行的是试运行，没有实际修改文件。使用 ${chalk.bold('--delete')} 选项（不带 ${chalk.bold('--dry-run')}）来实际删除未使用的导入`));
  } else {
    console.log(chalk.gray(`\n使用 ${chalk.bold('--delete')} 选项可以自动删除这些未使用的导入`));
  }
}

main().catch(err => {
  console.error(chalk.red('Error:'), err);
  process.exit(1);
}); 