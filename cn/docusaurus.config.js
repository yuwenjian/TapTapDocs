// @ts-check

const path = require("path");
const PREVIEW = process.env.PREVIEW ?? "false";

/** @type {import('@docusaurus/types').Config} */
const config = {
    organizationName: "taptap",
    projectName: "tapsdk-doc",
    title: "TapTap 开发者文档",
    url: process.env.APP_PUBLIC_PATH || "https://developer.taptap.cn",
    baseUrl:
        PREVIEW === "true" ? "/" : (process.env.APP_ROUTER_BASE_URL || "/docs/"),
    onBrokenLinks: "throw",
    onBrokenAnchors: "ignore",
    favicon: "img/logoh.png",
    trailingSlash: true,
    markdown: {
        format: 'mdx',
        hooks: {
            onBrokenMarkdownLinks: "throw",
        },
    },
    customFields: {
        mainDomainHost: "https://developer.taptap.cn/",
        dcDomainHost: "https://developer.taptap.cn?from=tds-docs",
    },

    // 本地搜索插件
    themes: [
        [
            "@easyops-cn/docusaurus-search-local",
            {
                hashed: "filename",  
                language: ["en", "zh"],
                docsRouteBasePath: "/",
                highlightSearchTermsOnTargetPage: true,
                searchBarPosition: "right",
            },
        ],
    ],
    i18n: {
        localeConfigs: {
            "zh-Hans": {
                label: "简体中文",
            },
            "en": {
                label: "English",
            },
        },
        defaultLocale: "zh-Hans",
        locales: ["zh-Hans", "en"],
    },

    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                    routeBasePath: "/",
                    lastVersion: "current",
                    versions: {
                        current: {
                            label: "v4",
                        },
                        'v3': {
                            label: 'v3',
                            path: 'v3',
                            banner: "unmaintained",
                        },
                        'v2': {
                            label: 'v2',
                            path: 'v2',
                            banner: 'unmaintained',
                        },
                    },
                },
                theme: {
                    customCss: require.resolve("./src/styles/index.scss"),
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                items: [
                    {
                        label: "文档首页",
                        to: "/",
                        position: "right",
                        activeBaseRegex: `^${PREVIEW === "true" ? "/" : "/docs/"
                            }(en/)?(?!.+)`,
                    },
                    {
                        label: "游戏商店",
                        to: "store",
                        position: "right",
                    },
                    {
                        label: "游戏服务",
                        to: "sdk",
                        position: "right",
                    },
                    {
                        label: "下载",
                        position: "right",
                        items: [
                            {
                                label: "设计资源",
                                to: "/design",
                            },
                            {
                                label: "SDK 工具包",
                                to: "/tap-download",
                            },
                        ],
                    },
                    {
                        type: "localeDropdown",
                        position: "right",
                    },
                    {
                        type: "docsVersionDropdown",
                        position: "right",
                    },
                ],
            },
            prism: {
                theme: require("./src/theme/prism-taptap"),
                additionalLanguages: ["csharp", "java", "php", "groovy", "swift", "dart", "kotlin", "json"],
            },
            image: "/img/logo.svg",
            metadata: [
                {
                    name: "keywords",
                    content: "taptap tds 开发者 文档",
                },
            ],
            colorMode: {
                defaultMode: "light",
                disableSwitch: true,
            },
        }),

    plugins: [
        "docusaurus-plugin-sass",
        path.resolve(__dirname, "./plugins/npsmeter"),
        [
            "docusaurus-plugin-llms",
            {
                // 是否生成 llms.txt 文件（包含文档链接的索引文件）
                generateLLMsTxt: true,
                // 是否生成 llms-full.txt 文件（包含所有文档完整内容的单文件）
                generateLLMsFullTxt: false,
                // 是否从生成的内容中排除导入语句（如 import 语句）
                excludeImports: true,
                // 是否移除重复的标题内容
                removeDuplicateHeadings: true,
                // 指定要包含的文件路径模式（glob 模式），只处理 docs/sdk 目录下的文件
                includeOrder: ["docs/sdk/**"],
                // 是否在最后包含不匹配 includeOrder 模式的文件（false 表示不包含）
                includeUnmatchedLast: false,
                // 要排除的文件路径模式（glob 模式），排除 _partials 目录
                // 注意：插件会自动排除非默认语言的 i18n 文档，无需手动配置 i18n/**
                ignoreFiles: ["docs/sdk/_partials/**"],
                // 是否生成独立的 markdown 文件（.md），llms.txt 中的链接将指向这些文件
                generateMarkdownFiles: false,
                // 设置为 false 时不输出 description
                includeDescriptionInLinks: false,
                // 自定义根内容
                rootContent: "本文档提供了 TapTap SDK 开发文档的完整目录索引。",
            },
        ],
    ],
};

module.exports = config;
