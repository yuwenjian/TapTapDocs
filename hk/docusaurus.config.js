// @ts-check

const path = require("path");
const PREVIEW = process.env.PREVIEW ?? "false";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "TapTap Developer Documentation",
  url: process.env.APP_PUBLIC_PATH || "https://developer.taptap.io",
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
    mainDomainHost: "https://www.taptap.io",
    dcDomainHost: "https://developer.taptap.io?from=tds-docs",
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
      en: {
        label: "English",
      },
      "zh-Hans": {
        label: "简体中文",
      },
    },
    defaultLocale: "en",
    locales: ["en", "zh-Hans"],
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
            "v3": {
              label: "v3",
              path: 'v3',
              banner: 'unmaintained',
            }
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
            activeBaseRegex: `^${
              PREVIEW === "true" ? "/" : "/docs/"
            }(zh-Hans/)?(?!.+)`,
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
        additionalLanguages: ["csharp", "java", "php", "groovy", "swift", "dart"],
      },
      image: "/img/logo.svg",
      metadata: [
        {
          name: "keywords",
          content: "taptap tds developer documentation",
        },
      ],
      colorMode: {
        defaultMode: "light",
        disableSwitch: true,
      },
    }),

  plugins: [
    "docusaurus-plugin-sass",
  ],
};

module.exports = config;
