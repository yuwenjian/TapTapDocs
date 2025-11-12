#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const assert = require('assert').strict;
const chalk = require('chalk');

// 获取脚本所在目录
const SCRIPT_DIR = path.resolve(__dirname);

// 基础目录配置
const BASE_DIR = SCRIPT_DIR;
const REGIONS = ['cn', 'hk'];

// 颜色输出函数
const printSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
const printError = (msg) => console.log(chalk.red(`✗ ${msg}`));
const printInfo = (msg) => console.log(chalk.cyan(msg));
const printWarning = (msg) => console.log(chalk.yellow(`! ${msg}`));

/**
 * 获取文件路径
 */
function getFilePath(type, region, filename) {
  switch(type) {
    case 'actual':
      return path.join(BASE_DIR, region, filename);
    case 'expected':
      return path.join(BASE_DIR, 'expected', region, filename);
    case 'original':
      return path.join(BASE_DIR, 'originals', region, filename);
    default:
      throw new Error(`未知的文件类型: ${type}`);
  }
}

/**
 * 获取测试文件列表
 */
async function getTestFiles(region) {
  try {
    const files = await fs.readdir(path.join(BASE_DIR, 'originals', region));
    return files.filter(file => file.endsWith('.mdx'));
  } catch (error) {
    printError(`获取测试文件列表失败: ${error.message}`);
    return [];
  }
}

/**
 * 验证测试结果
 */
async function verifyTestResults() {
  printInfo('开始验证测试结果...');

  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  // 遍历所有区域
  for (const region of REGIONS) {
    printInfo(`\n验证 ${region.toUpperCase()} 区域文件:`);
    
    // 获取该区域的测试文件列表
    const testFiles = await getTestFiles(region);
    if (testFiles.length === 0) {
      printWarning(`区域 ${region} 没有找到测试文件`);
      continue;
    }
    
    // 遍历该区域的所有测试文件
    for (const filename of testFiles) {
      const actualFile = getFilePath('actual', region, filename);
      const expectedFile = getFilePath('expected', region, filename);
      
      printInfo(`\n检查文件: ${actualFile}`);
      
      try {
        // 读取实际处理结果和预期结果
        const actualContent = await fs.readFile(actualFile, 'utf8');
        const expectedContent = await fs.readFile(expectedFile, 'utf8');
        
        // 简单去除空白字符后比较
        const normalizedActual = actualContent.replace(/\s+/g, ' ').trim();
        const normalizedExpected = expectedContent.replace(/\s+/g, ' ').trim();
        
        try {
          // 判断内容是否一致
          assert.strictEqual(
            normalizedActual, 
            normalizedExpected, 
            '处理结果与预期不符'
          );
          
          // 额外检查是否还有条件标签
          const conditionalTags = [
            '<Conditional brand="tds">',
            '<Conditional brand="leancloud">',
            '<Conditional region="cn">',
            '<Conditional region="global">',
            '</Conditional>'
          ];
          
          let tagsFound = false;
          for (const tag of conditionalTags) {
            if (actualContent.includes(tag)) {
              tagsFound = true;
              printError(`发现未移除的标签: "${tag}"`);
              failures.push(`${actualFile}: 发现未移除的标签: "${tag}"`);
            }
          }
          
          if (!tagsFound) {
            printSuccess(`文件处理结果与预期一致`);
            passedTests++;
          } else {
            failedTests++;
            printError(`文件 ${actualFile} 验证失败: 存在未移除的标签`);
          }
        } catch (error) {
          failedTests++;
          printError(`文件 ${actualFile} 验证失败: ${error.message}`);
          failures.push(`${actualFile}: ${error.message}`);
        }
      } catch (error) {
        failedTests++;
        printError(`读取文件错误: ${error.message}`);
        failures.push(`${actualFile}: 读取文件错误: ${error.message}`);
      }
    }
  }

  // 输出总结
  console.log('\n' + '-'.repeat(80));
  if (failedTests > 0) {
    printError(`测试结果: ${passedTests} 通过, ${failedTests} 失败`);
    console.log('\n失败详情:');
    failures.forEach(failure => printError(`- ${failure}`));
    process.exit(1);
  } else {
    printSuccess(`所有 ${passedTests} 个测试用例全部通过！`);
    process.exit(0);
  }
}

/**
 * 更新预期结果
 */
async function updateExpectedResults() {
  printInfo('更新预期结果...');
  
  for (const region of REGIONS) {
    // 获取该区域的测试文件列表
    const testFiles = await getTestFiles(region);
    if (testFiles.length === 0) {
      printWarning(`区域 ${region} 没有找到测试文件`);
      continue;
    }
    
    for (const filename of testFiles) {
      const sourceFile = getFilePath('actual', region, filename);
      const targetFile = getFilePath('expected', region, filename);
      
      try {
        // 确保目标目录存在
        const targetDir = path.dirname(targetFile);
        await fs.mkdir(targetDir, { recursive: true });
        
        await fs.copyFile(sourceFile, targetFile);
        printSuccess(`已更新: ${targetFile}`);
      } catch (error) {
        printError(`更新失败: ${targetFile} - ${error.message}`);
      }
    }
  }
  
  printInfo('预期结果更新完成');
}

// 根据命令行参数决定执行更新或验证
const args = process.argv.slice(2);
const shouldUpdate = args.includes('--update');

if (shouldUpdate) {
  updateExpectedResults().catch(err => {
    console.error(chalk.red('Error:'), err);
    process.exit(1);
  });
} else {
  verifyTestResults().catch(err => {
    console.error(chalk.red('Error:'), err);
    process.exit(1);
  });
} 