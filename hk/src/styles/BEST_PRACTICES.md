# Docusaurus/Infima 样式自定义最佳实践

本文档总结了在 Docusaurus/Infima 项目中自定义样式的核心最佳实践，帮助团队保持代码质量和一致性。

## 1. CSS 变量命名规范

### 覆盖 Infima 默认值 → 使用 `--ifm-` 前缀

```scss
/* ✅ 正确：覆盖 Infima 已有的变量 */
--ifm-color-primary: #06c4b0;
--ifm-code-background: #f4f4f4;
--ifm-table-border-color: #ebeff0;
```

**原则**：如果变量在 Infima 中已经存在，使用 `--ifm-` 前缀来覆盖默认值。

### 自定义新变量 → 使用 `--tap-` 前缀

```scss
/* ✅ 正确：Infima 中没有的变量，使用自定义前缀 */
--tap-table-hover-background: #fafafa;
--tap-code-color: #1d2127;
--tap-code-line-height: 1.5;
--tap-pre-border-color: #e0e0e0;
--tap-pre-margin-vertical: 1.25rem;
```

**原则**：如果变量是 Infima 中没有的新变量，使用 `--tap-` 前缀，避免命名冲突。

**如何判断**：在 `node_modules/infima/styles` 中搜索变量名，如果不存在则是自定义变量。

---

## 2. CSS 变量组织

### 在 `:root` 中集中定义变量

```scss
:root {
  /* 按功能分组 */
  /* 品牌主色 */
  /* 字体设置 */
  /* 表格样式设置 */
  /* 代码样式设置 */
}
```

**原则**：
- ✅ 所有变量在 `:root` 中定义
- ✅ 按功能分组，添加清晰的注释
- ✅ 便于维护和主题化
- ✅ **重要**：变量值应该直接在 `index.scss` 的 `:root` 中定义，不要引用 `variable.scss` 中的变量

### 不要引用其他文件的变量

```scss
/* ❌ 错误：引用 variable.scss 中的变量 */
--ifm-color-content: var(--tap-grey7);
--tap-table-border-radius: var(--tap-border-radius-base);

/* ✅ 正确：直接在 index.scss 中定义值 */
--ifm-color-content: #1d2127;
--tap-table-border-radius: 4px;
```

**原则**：
- ✅ `index.scss` 应该独立，不依赖 `variable.scss`
- ✅ 颜色、圆角、阴影等值直接在 `index.scss` 的 `:root` 中定义
- ✅ 保持 `index.scss` 的完整性和可维护性

---

## 3. 作用域限定

### 使用选择器限定样式作用域

```scss
/* ✅ 正确：限定在 .markdown 内 */
.markdown {
  code { ... }
  pre { ... }
  table { ... }
}

/* ❌ 错误：全局样式，可能影响其他组件 */
code { ... }
```

**原则**：
- ✅ 样式限定在特定作用域（如 `.markdown`）
- ✅ 避免全局污染
- ✅ 必要时使用 `[role="tabpanel"]` 适配标签页内容

---

## 4. 最小化覆盖

### 只覆盖必要的属性

```scss
/* ✅ 正确：只覆盖需要的属性 */
.markdown code {
  border: none; /* 只覆盖边框 */
}

/* ❌ 错误：重复定义所有属性 */
.markdown code {
  background-color: var(--ifm-code-background);
  border: none;
  border-radius: var(--ifm-code-border-radius);
  /* ... 其他继承的属性 */
}

/* ✅ 正确：如果通过继承可以获得相同值，无需显式定义 */
.markdown table {
  th, td {
    /* 不定义 color，会通过继承获得 var(--ifm-color-content) */
  }
}
```

**原则**：
- ✅ 只覆盖需要修改的属性
- ✅ 其他属性继承 Infima 默认值
- ✅ 如果通过继承链可以获得相同的值，无需显式定义
- ✅ 减少代码量，提高可维护性

---

## 5. 使用 CSS 变量而非硬编码

### 优先使用变量

```scss
/* ✅ 正确：使用变量 */
color: var(--tap-code-color);
padding: var(--ifm-code-padding-vertical) var(--ifm-code-padding-horizontal);

/* ❌ 错误：硬编码值 */
color: #1d2127;
padding: 0.2rem 0.4rem;
```

**原则**：
- ✅ 颜色、间距等使用变量
- ✅ 便于统一修改和主题化
- ✅ 提高代码可读性

---

## 6. 注释规范

### 添加清晰的注释

```scss
/* ✅ 正确：注释说明用途和变量类型 */
/* 行内代码文字颜色（自定义变量） */
--tap-code-color: #1d2127;

/* 表格 hover 背景色（自定义变量） */
--tap-table-hover-background: #fafafa;
```

**原则**：
- ✅ 说明变量用途
- ✅ 标注是否为自定义变量
- ✅ 注释中不需要引用其他文件的变量（如 `var(--tap-grey7)`），直接说明颜色值即可

---

## 7. 避免重复定义和未使用的变量

### 检查是否与默认值相同

```scss
/* ❌ 错误：重复定义默认值 */
--ifm-font-size-base: 100%; /* Infima 默认就是 100% */

/* ✅ 正确：将默认值注释掉，保留信息便于阅读 */
// --ifm-font-size-base: 100%; /* Infima 默认值，无需覆盖 */

/* ✅ 正确：只定义需要覆盖的值 */
--ifm-code-background: #f4f4f4; /* 覆盖默认的动态值 */
```

**原则**：
- ✅ 对比 Infima 默认值
- ✅ 将值等于默认值的变量注释掉（使用 `//`），而不是删除
- ✅ 保留注释说明便于阅读和维护
- ✅ 如果将来需要修改，取消注释即可

**如何检查**：查看 `node_modules/infima/styles` 中的默认值定义。

### 删除未使用的变量

```scss
/* ❌ 错误：定义但未使用的变量 */
--tap-box-shadow-1: 0px 1px 5px rgba(45, 47, 51, 0.1); /* 没有地方使用 */

/* ✅ 正确：删除未使用的变量，保持代码整洁 */
/* 如果确实需要，再添加 */
```

**原则**：
- ✅ 定期检查并删除未使用的变量
- ✅ 使用 `grep` 或搜索工具查找变量的使用情况
- ✅ 保持代码库整洁，避免冗余

---

## 8. 响应式设计

### 使用相对单位

```scss
/* ✅ 正确：使用 rem、em、% 等相对单位 */
font-size: 0.875rem; /* 14px */
padding: 1.25rem; /* 20px */

/* ❌ 错误：使用固定 px 值（除非必要） */
font-size: 14px;
padding: 20px;
```

**原则**：
- ✅ 优先使用 `rem`、`em`、`%`
- ✅ 必要时使用 `px`（如边框、阴影）
- ✅ 确保响应式适配

---

## 9. 代码组织

### 按功能模块组织

```scss
:root {
  /* 1. 品牌主色 */
  /* 2. 字体设置 */
  /* 3. 菜单样式设置 */
  /* 4. 表格样式设置 */
  /* 5. 代码样式设置 */
}

.markdown {
  /* 1. 标题样式覆盖 */
  /* 2. 行内代码样式 */
  /* 3. 代码块样式 */
  /* 4. 表格样式 */
}
```

**原则**：
- ✅ 按功能分组
- ✅ 相关样式放在一起
- ✅ 使用注释分隔模块

---

## 10. 性能优化

### 使用 CSS 变量和过渡动画

```scss
/* ✅ 正确：使用 transition 优化动画 */
tr {
  transition: background-color 0.2s ease;
}

/* ✅ 正确：使用 CSS 变量，便于主题切换 */
background-color: var(--ifm-code-background);
```

**原则**：
- ✅ 使用 `transition` 优化交互动画
- ✅ 利用 CSS 变量减少重复
- ✅ 避免不必要的重绘

---

## 11. 可访问性

### 保持足够的对比度

```scss
/* ✅ 正确：确保文字和背景有足够对比度 */
--tap-code-color: #1d2127; /* 深色文字 */
--ifm-code-background: #f4f4f4; /* 浅色背景 */
```

**原则**：
- ✅ 确保颜色对比度符合 WCAG 标准
- ✅ 提供 hover 状态反馈
- ✅ 保持交互清晰

---

## 12. 与 Infima 兼容

### 遵循 Infima 的设计模式

```scss
/* ✅ 正确：使用 Infima 的垂直节奏系统 */
margin-top: calc(
  var(--ifm-heading-vertical-rhythm-top) * var(--ifm-leading)
);

/* ✅ 正确：使用 Infima 的间距变量 */
margin-bottom: var(--ifm-spacing-vertical);
```

**原则**：
- ✅ 遵循 Infima 的设计系统
- ✅ 使用 Infima 提供的变量和模式
- ✅ 保持与 Infima 的兼容性

---

## 核心原则总结

1. **命名规范**：覆盖用 `--ifm-`，新增用 `--tap-`
2. **变量优先**：使用 CSS 变量而非硬编码
3. **变量独立性**：`index.scss` 中的变量应该直接定义值，不引用 `variable.scss`
4. **作用域限定**：样式限定在特定作用域内
5. **最小覆盖**：只覆盖必要的属性，避免不必要的显式定义
6. **代码组织**：按功能分组，添加清晰注释
7. **避免重复**：将值等于默认值的变量注释掉，删除未使用的变量
8. **响应式**：优先使用相对单位
9. **可维护性**：清晰的注释和结构

---

## 检查清单

在添加新样式时，请检查：

- [ ] 变量命名是否正确（`--ifm-` vs `--tap-`）
- [ ] 是否在 `:root` 中定义变量
- [ ] 变量值是否直接在 `index.scss` 中定义（不引用 `variable.scss`）
- [ ] 样式是否限定在特定作用域
- [ ] 是否只覆盖必要的属性
- [ ] 是否使用变量而非硬编码
- [ ] 是否添加了清晰的注释
- [ ] 是否避免了重复定义
- [ ] 是否删除了未使用的变量
- [ ] 是否使用了相对单位
- [ ] 是否遵循了 Infima 的设计模式

---

## 参考资源

- [Infima 官方文档](https://infima.dev/)
- [Docusaurus 样式指南](https://docusaurus.io/docs/styling-layout)
- Infima 源码：`node_modules/infima/styles/`

