const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');

// === 1. 替换 :root 变量 ===
css = css.replace(
  /--bg: #f8f7f4;/,
  '--bg: #FFFFFF;'
);
css = css.replace(
  /--card-bg: #ffffff;/,
  '--card-bg: #FFFFFF;'
);
css = css.replace(
  /--text: #374151;/,
  '--text: #3A3A3C;'
);
css = css.replace(
  /--text-light: #6b7280;/,
  '--text-light: #86868B;'
);
css = css.replace(
  /--text-h: #111827;/,
  '--text-h: #1D1D1F;'
);
css = css.replace(
  /--border: #e5e7eb;/,
  '--border: #E5E5EA;'
);
css = css.replace(
  /--accent: #1a5c33;/,
  '--accent: #1B7A3D;'
);
css = css.replace(
  /--accent-light: #edf7ee;/,
  '--accent-light: #E8F5EC;'
);
css = css.replace(
  /--success: #10b981;/,
  '--success: #34C759;'
);
css = css.replace(
  /--shadow: 0 1px 3px rgba\(0, 0, 0, 0\.08\), 0 4px 12px rgba\(0, 0, 0, 0\.05\);/,
  '--shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04);'
);
css = css.replace(
  /--shadow-lg: 0 10px 40px rgba\(0, 0, 0, 0\.12\);/,
  '--shadow-lg: 0 8px 32px rgba(0,0,0,0.12);'
);
css = css.replace(
  /--shadow-sm: 0 1px 3px rgba\(0,0,0,0\.06\), 0 1px 2px rgba\(0,0,0,0\.04\);/,
  '--shadow-sm: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04);'
);
css = css.replace(
  /--shadow-md: 0 4px 12px rgba\(0,0,0,0\.08\), 0 2px 4px rgba\(0,0,0,0\.04\);/,
  '--shadow-md: 0 8px 32px rgba(0,0,0,0.12);'
);
// 删除 --shadow-accent
css = css.replace(
  /  --shadow-accent: 0 4px 16px rgba\(37,99,235,0\.25\);\n/,
  ''
);
// 统一半径变量
css = css.replace(
  /--radius: 16px;/,
  '--radius: 16px;'
);
css = css.replace(
  /--radius-sm: 10px;/,
  '--radius-sm: 8px;'
);
css = css.replace(
  /--radius-xs: 6px;/,
  '--radius-xs: 8px;'
);
css = css.replace(
  /--radius-md: 14px;/,
  '--radius-md: 12px;'
);
css = css.replace(
  /--radius-lg: 18px;/,
  '--radius-lg: 16px;'
);

// === 2. 删除 "全局视觉升级" 里的 :root 重复变量 ===
css = css.replace(
  /\n\/\* 1\. 底色更暖 \*\/\n:root \{\n  --bg-warm:[^}]+\}\n/,
  '\n'
);

// 删除 --bg-warm 的使用
css = css.replace(
  /\.app-container, body, #root \{\n  background: var\(--bg-warm\) !important;\n\}\n/,
  '.app-container, body, #root {\n  background: var(--bg);\n}\n'
);

// === 3. 合并卡片样式到原始选择器，删除 !important 块 ===
// 删除 "3. 所有卡片圆角 + 阴影统一" 这个大块
css = css.replace(
  /\n\/\* 3\. 所有卡片圆角 \+ 阴影统一 \*\/\n[\s\S]*?(?=\n\/\* 4\.)/,
  '\n'
);

// 删除 "4. 所有按钮圆角更大" 块
css = css.replace(
  /\n\/\* 4\. 所有按钮圆角更大 \*\/\n[\s\S]*?(?=\n\/\* 5\.)/,
  '\n'
);

// 删除 "5. 主要行动按钮加微动效" 块
css = css.replace(
  /\n\/\* 5\. 主要行动按钮加微动效 \*\/\n[\s\S]*?(?=\n\/\* 6\.)/,
  '\n'
);

// 删除 "6. 底部导航玻璃效果升级" 块
css = css.replace(
  /\n\/\* 6\. 底部导航玻璃效果升级 \*\/\n[\s\S]*?(?=\n\/\* 7\.)/,
  '\n'
);

// 删除 "7. 输入框圆角" 块
css = css.replace(
  /\n\/\* 7\. 输入框圆角 \*\/\n[\s\S]*?(?=\n\/\* 8\.)/,
  '\n'
);

// 删除 "8. 字体层级更清晰" 块
css = css.replace(
  /\n\/\* 8\. 字体层级更清晰 \*\/\n[\s\S]*?(?=\n\/\* 9\.)/,
  '\n'
);

// 删除 "9. 成就解锁 toast" 块
css = css.replace(
  /\n\/\* 9\. 成就解锁 toast 更有仪式感 \*\/\n[\s\S]*?(?=\n\/\* 10\.)/,
  '\n'
);

// 删除 "10. 田园场景卡片微动效" 块
css = css.replace(
  /\n\/\* 10\. 田园场景卡片微动效 \*\/\n[\s\S]*?(?=\n\/\* 11\.)/,
  '\n'
);

// 删除 "11. 目标卡片 hover" 块
css = css.replace(
  /\n\/\* 11\. 目标卡片 hover 更柔和 \*\/\n[\s\S]*?(?=\n\/\* 12\.)/,
  '\n'
);

// 删除 "12. 成长页数据格" 块
css = css.replace(
  /\n\/\* 12\. 成长页数据格更有质感 \*\/\n[\s\S]*?(?=\n\/\* 13\.)/,
  '\n'
);

// 删除 "13. 图鉴格子 hover" 块
css = css.replace(
  /\n\/\* 13\. 图鉴格子 hover \*\/\n[\s\S]*?(?=\n\/\* 14\.)/,
  '\n'
);

// 删除 "14. 教练选择卡片" 块
css = css.replace(
  /\n\/\* 14\. 教练选择卡片 \*\/\n[\s\S]*?(?=\n\/\* 15\.)/,
  '\n'
);

// 删除 "15. 页面进入动画" 块
css = css.replace(
  /\n\/\* 15\. 页面进入动画 \*\/\n[\s\S]*?(?=\n\/\* ===== 分享田园 ===== \*\/)/,
  '\n'
);

// 删除第二个 :root 块 (line 6411)
css = css.replace(
  /\n:root \{\n  --radius-sm: 14px;\n  --radius-md: 18px;\n  --radius-lg: 22px;\n\}\n/,
  '\n'
);

// === 4. 删除全局剩余的 !important ===
// 先统计
const beforeCount = (css.match(/!important/g) || []).length;
// 删除所有 !important
css = css.replace(/ !important/g, '');
const afterCount = (css.match(/!important/g) || []).length;
console.log(`!important: ${beforeCount} -> ${afterCount}`);

// === 5. 全局替换 box-shadow ===
// 卡片类 box-shadow
css = css.replace(
  /box-shadow: 0 1px 3px rgba\(0, ?0, ?0, ?0\.08\), 0 4px 12px rgba\(0, ?0, ?0, ?0\.05\)/g,
  'box-shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)'
);
css = css.replace(
  /box-shadow: 0 1px 3px rgba\(0,0,0,0\.06\), 0 1px 2px rgba\(0,0,0,0\.04\)/g,
  'box-shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)'
);
css = css.replace(
  /box-shadow: 0 4px 12px rgba\(0,0,0,0\.08\), 0 2px 4px rgba\(0,0,0,0\.04\)/g,
  'box-shadow: 0 8px 32px rgba(0,0,0,0.12)'
);
css = css.replace(
  /box-shadow: 0 1px 2px rgba\(0,0,0,0\.03\), 0 6px 20px rgba\(0,0,0,0\.05\)/g,
  'box-shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)'
);
css = css.replace(
  /box-shadow: 0 1px 2px rgba\(0,0,0,0\.04\), 0 4px 14px rgba\(0,0,0,0\.06\)/g,
  'box-shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)'
);
// var(--shadow-soft) and var(--shadow-card) - replace with direct values
css = css.replace(/var\(--shadow-soft\)/g, '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)');
css = css.replace(/var\(--shadow-card\)/g, '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)');

// === 6. 全局替换 border-radius ===
// 18px -> 16px
css = css.replace(/border-radius: 18px/g, 'border-radius: 16px');
// 20px -> 16px
css = css.replace(/border-radius: 20px/g, 'border-radius: 16px');
// 24px -> 16px
css = css.replace(/border-radius: 24px/g, 'border-radius: 16px');
// 14px -> 12px
css = css.replace(/border-radius: 14px/g, 'border-radius: 12px');
// 6px -> 8px
css = css.replace(/border-radius: 6px/g, 'border-radius: 8px');

// === 7. 字重统一 ===
// 800 -> 600
css = css.replace(/font-weight: 800/g, 'font-weight: 600');
// 900 -> 600
css = css.replace(/font-weight: 900/g, 'font-weight: 600');
// 700 -> 600 (except stat-value, share-stat-num)
// We'll do this more carefully - replace all 700 with 600, then restore specific ones
css = css.replace(/font-weight: 700/g, 'font-weight: 600');
// Restore 700 for stat numbers
css = css.replace(/(\.share-stat-num[^}]*font-weight:) 600/g, '$1 700');

// === 8. Tab bar 玻璃效果 ===
css = css.replace(
  /\.tab-bar \{[^}]*\}/,
  `.tab-bar {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-top: 0.5px solid rgba(0,0,0,0.08);
}`
);

// === 9. 清理空的全局视觉升级 section header ===
css = css.replace(
  /\n\/\* ================================================\n   全局视觉升级 · 治愈软萌风\n   ================================================ \*\/\n/,
  '\n'
);

// 清理多余空行
css = css.replace(/\n{4,}/g, '\n\n');

fs.writeFileSync('src/App.css', css);
console.log('CSS refactoring done!');
console.log('Lines:', css.split('\n').length);
