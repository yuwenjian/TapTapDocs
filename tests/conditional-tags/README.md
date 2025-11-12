# 条件标签处理测试用例

此目录包含用于测试 `scripts/clean-conditional.js` 脚本的测试用例。测试用例设计为覆盖各种可能的条件标签情况，特别是前面未覆盖的问题。

## 测试用例说明

- **basic-test.mdx**: 基本测试用例，包含简单的条件标签
- **nested-tags.mdx**: 包含嵌套条件标签的测试用例
- **complex-nested.mdx**: 复杂嵌套条件标签，包括Brand和Region的交叉嵌套
- **unmatched-tags.mdx**: 包含未匹配标签的测试用例
- **multi-empty-lines.mdx**: 包含多个空行的测试用例
- **setup-domain-like.mdx**: 模拟真实文件(setup-domain.mdx)结构的测试用例
- **single-quote-tags.mdx**: 使用单引号属性值的条件标签测试用例，确保脚本能正确处理单引号和双引号

## 目录结构

- `cn/`: 模拟中国区域的测试用例
- `hk/`: 模拟海外区域的测试用例
- `originals/`: 存放原始测试文件
- `expected/`: 存放预期的处理结果文件，作为测试验证的基准

## 使用方法

### 运行测试脚本

运行以下命令来执行测试，包括处理文件和验证结果：

```bash
# 运行测试并验证结果
./tests/conditional-tags/run-tests.sh

# 或者如果已经在测试目录中
cd tests/conditional-tags
./run-tests.sh
```

此命令会：
1. 恢复测试文件到初始状态（调用 restore-tests.sh）
2. 运行条件标签处理脚本处理所有测试文件
3. 验证处理结果是否符合预期（调用 test-verification.js）
4. 输出详细的测试报告，显示通过和失败的测试用例

### 更新预期结果

如果处理脚本的行为有意更改，需要更新预期结果：

```bash
./tests/conditional-tags/run-tests.sh --update

# 或者如果已经在测试目录中
cd tests/conditional-tags
./run-tests.sh --update
```

这将处理所有测试文件并将结果保存为新的预期结果。

### 恢复测试用例

如果需要单独恢复测试用例到原始状态，可以运行：

```bash
./tests/conditional-tags/restore-tests.sh

# 或者如果已经在测试目录中
cd tests/conditional-tags
./restore-tests.sh
```

### 单独执行验证

如果只需要验证结果而不重新处理文件：

```bash
node tests/conditional-tags/test-verification.js

# 或者如果已经在测试目录中
cd tests/conditional-tags
node test-verification.js
```

## 脚本说明

- **run-tests.sh**: 主要测试脚本，负责恢复测试文件、处理条件标签，并验证结果
- **restore-tests.sh**: 用于将测试文件恢复到初始状态
- **test-verification.js**: 负责验证处理结果是否符合预期，或更新预期结果

## 路径说明

所有脚本都使用相对路径和绝对路径的自动检测，可以从项目根目录或测试目录中运行，不需要担心路径问题。 