# Satori 中文乱码问题解决指南

## 问题描述

在使用 satori 生成包含中文文本的图片时，经常会遇到中文显示为乱码或方块的问题。

## 问题原因

中文乱码主要由以下原因导致：

1. **字体不支持中文**：使用的字体（如 Roboto、Arial 等）不包含中文字符
2. **字体配置错误**：在 satori 配置中字体名称与实际加载的字体不匹配
3. **字体文件缺失**：字体文件路径错误或文件损坏

## 解决方案

### 1. 下载支持中文的字体

推荐使用以下免费的中文字体：

- **Noto Sans SC**（思源无衬线简体中文）
- **Noto Serif SC**（思源衬线简体中文）
- **Source Han Sans**（思源黑体）

```bash
# 下载 Noto Sans SC 字体
curl -L -o "server/assets/NotoSansSC-Regular.ttf" \
  "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf"
```

### 2. 修改字体加载代码

```typescript
import { Injectable } from '@nestjs/common';
import satori from 'satori';
import { readFileSync } from 'fs';
import path from 'path';

@Injectable()
export class ScreenshotService {
  private fontCache: Map<string, Buffer> = new Map();

  private loadFonts(): void {
    if (this.fontCache.size === 0) {
      try {
        // 加载支持中文的 Noto Sans 字体
        const notoSansPath = path.join(process.cwd(), 'server/assets/NotoSansSC-Regular.ttf');
        const notoSansBuffer = readFileSync(notoSansPath);
        this.fontCache.set('Noto Sans SC', notoSansBuffer);
        
        // 加载英文字体作为后备
        const robotoPath = path.join(process.cwd(), 'server/assets/Roboto-Regular.ttf');
        const robotoBuffer = readFileSync(robotoPath);
        this.fontCache.set('Roboto', robotoBuffer);
        
        console.log('✅ 字体加载成功:', Array.from(this.fontCache.keys()));
      } catch (error) {
        console.error('❌ 字体加载失败:', error);
      }
    }
  }
}
```

### 3. 正确配置字体

```typescript
async generateImage() {
  // 准备字体配置
  const fonts: Array<{
    name: string;
    weight: 400;  
    style: 'normal';
    data: Buffer;
  }> = [];
  
  // 添加中文字体
  if (this.fontCache.has('Noto Sans SC')) {
    const fontData = this.fontCache.get('Noto Sans SC');
    if (fontData) {
      fonts.push({
        name: 'Noto Sans SC',
        weight: 400,
        style: 'normal',
        data: fontData,
      });
    }
  }
  
  // 添加英文字体作为后备
  if (this.fontCache.has('Roboto')) {
    const fontData = this.fontCache.get('Roboto');
    if (fontData) {
      fonts.push({
        name: 'Roboto',
        weight: 400,
        style: 'normal',
        data: fontData,
      });
    }
  }

  const svg = await satori(element, {
    width: 500,
    height: undefined,
    fonts: fonts, // 使用配置好的字体
  });
}
```

### 4. 在 CSS 中指定字体族

```typescript
const element = {
  type: 'div',
  props: {
    style: {
      fontFamily: 'Noto Sans SC, Roboto, sans-serif', // 优先使用中文字体
      // 其他样式...
    },
    children: '这是中文测试文本 This is English text'
  }
};
```

## 最佳实践

### 1. 字体回退机制

始终提供字体回退方案：

```css
fontFamily: 'Noto Sans SC, PingFang SC, Microsoft YaHei, Roboto, Arial, sans-serif'
```

### 2. 字体文件管理

- 将字体文件放在 `server/assets/` 目录下
- 使用语义化的文件名，如 `NotoSansSC-Regular.ttf`
- 定期检查字体文件是否完整

### 3. 错误处理

```typescript
try {
  const fontBuffer = readFileSync(fontPath);
  this.fontCache.set(fontName, fontBuffer);
} catch (error) {
  console.error(`字体加载失败: ${fontPath}`, error);
  // 提供备用字体方案
}
```

### 4. 性能优化

- 使用 Map 缓存字体数据，避免重复读取
- 只加载需要的字体文件
- 考虑使用字体子集来减小文件大小

## 常见问题

### Q: 为什么有些中文字符还是显示不出来？

A: 可能原因：
1. 字体文件不完整，缺少某些字符
2. 使用了非标准的 Unicode 字符
3. 字体版本过旧

**解决方案**：使用完整版的 Noto Sans SC 字体，它包含最全面的中文字符集。

### Q: 如何支持繁体中文？

A: 下载并使用 Noto Sans TC（繁体中文）字体：

```bash
curl -L -o "server/assets/NotoSansTC-Regular.ttf" \
  "https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf"
```

### Q: 能否同时支持简体和繁体中文？

A: 可以，加载多个字体文件：

```typescript
fonts.push(
  { name: 'Noto Sans SC', data: simplifiedChineseFont, weight: 400, style: 'normal' },
  { name: 'Noto Sans TC', data: traditionalChineseFont, weight: 400, style: 'normal' }
);
```

然后在 CSS 中指定：`fontFamily: 'Noto Sans SC, Noto Sans TC, sans-serif'`

## 验证结果

生成图片后，检查以下内容：

1. ✅ 中文字符正常显示，没有乱码
2. ✅ 英文和数字正常显示
3. ✅ 字体样式（粗细、大小）符合预期
4. ✅ 文本布局正确，没有重叠或错位

## 相关资源

- [Noto CJK 字体下载](https://github.com/googlefonts/noto-cjk)
- [Google Fonts](https://fonts.google.com/)
- [Satori 官方文档](https://github.com/vercel/satori)
- [Unicode 字符集](https://unicode.org/)

---

📝 **更新日期**：2025-06-25  
🔧 **适用版本**：Satori v0.10.0+  
💡 **提示**：如果遇到其他问题，请检查字体文件路径和 Node.js 版本兼容性。