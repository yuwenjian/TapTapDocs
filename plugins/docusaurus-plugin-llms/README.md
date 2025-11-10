# docusaurus-plugin-llms

这是 `docusaurus-plugin-llms` 插件的编译产物，直接存放在项目中。

## 插件信息

- **远程仓库**: [https://github.com/apollopy/docusaurus-plugin-llms](https://github.com/apollopy/docusaurus-plugin-llms)
- **原始仓库**: Forked from [rachfop/docusaurus-plugin-llms](https://github.com/rachfop/docusaurus-plugin-llms)
- **NPM 包**: [docusaurus-plugin-llms](https://www.npmjs.com/package/docusaurus-plugin-llms)

## 更新插件

如果远程仓库有更新，可以拉取最新代码后更新：

```bash
# 1. 拉取远程仓库最新代码
cd <插件源码目录>
git pull origin main

# 2. 编译插件
npm run build

# 3. 复制编译产物到项目
cp -r lib/* <项目根目录>/plugins/docusaurus-plugin-llms/lib/
cp package.json <项目根目录>/plugins/docusaurus-plugin-llms/

# 4. 重新安装依赖
cd <项目根目录>
yarn install
```

## 文件说明

- `lib/` - 编译后的 JavaScript 文件（TypeScript 编译产物）
- `package.json` - 插件配置和依赖信息

## 注意事项

- 编译产物已直接存放在项目中，不需要从 npm 安装
- 修改插件源码后需要按照上述步骤更新编译产物
- 此目录应该提交到 Git 仓库中
- 如需查看插件源码或提交修改，请访问 [GitHub 仓库](https://github.com/apollopy/docusaurus-plugin-llms)

