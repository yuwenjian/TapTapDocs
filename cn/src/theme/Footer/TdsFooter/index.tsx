import React from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { Footer as SFooter, Language } from './lib/ssr/footer'
import './lib/ssr/style.css';

// 缓存渲染结果
const htmlCache = {
  'en': '',
  'zh-Hans': '',
};

function TdsFooter() {
  const {
    i18n: { currentLocale },
  } = useDocusaurusContext();
  
  // 确定使用哪种语言
  const language = currentLocale === 'en' ? Language.en : Language.zh_CN;
  const cacheKey = currentLocale === 'en' ? 'en' : 'zh-Hans';
  
  // 如果缓存中没有该语言的HTML，则渲染并缓存
  if (!htmlCache[cacheKey]) {
    const result = SFooter.render({
      language: language,
      tapUrl: 'https://www.taptap.cn',
      discordUrl: 'https://discord.gg/ZyuM66bAwx',
    });
    htmlCache[cacheKey] = result.html;
  }
  
  return (<div dangerouslySetInnerHTML={{__html: htmlCache[cacheKey]}}></div>);
};

export default TdsFooter;
