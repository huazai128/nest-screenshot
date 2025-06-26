# Satori 动态高度使用指南

## 问题
satori 的 width 和 height 可以根据 DOM 动态获取高度吗？

## 答案
**是的！** satori 支持多种方式来实现动态高度计算。

## 方法一：使用 `undefined` 自动计算高度（推荐）

这是最简单的方法，只需要将 `height` 设置为 `undefined`：

```typescript
const svg = await satori(content, {
  width: 400,
  height: undefined, // 🔑 关键：设置为 undefined 自动计算高度
  fonts: [...],
});
```

### 优点
- 最简单，一行代码解决
- satori 会根据内容自动计算合适的高度
- 适用于大多数场景

### 缺点
- 无法预知最终高度
- 对于需要精确控制的场景可能不够灵活

## 方法二：预渲染方式（精确控制）

这种方法通过两次渲染来获得精确的高度控制：

```typescript
// 第一次渲染：使用较大的高度获取实际尺寸
const firstRender = await satori(content, {
  width: 400,
  height: 1000, // 足够大的高度
  fonts: [...],
});

// 从 SVG 中提取实际高度
const heightMatch = firstRender.match(/height="(\d+)"/);
const actualHeight = heightMatch ? parseInt(heightMatch[1]) : 1000;

// 第二次渲染：使用精确高度
const finalSvg = await satori(content, {
  width: 400,
  height: actualHeight, // 使用实际高度
  fonts: [...],
});
```

### 优点
- 可以获得精确的高度值
- 适用于需要知道确切尺寸的场景
- 更好的布局控制

### 缺点
- 需要渲染两次，性能开销更大
- 代码相对复杂

## 方法三：预估计算（性能优化）

如果你想要一个性能更好的预估方案：

```typescript
function estimateTextHeight(
  text: string, 
  fontSize: number = 16, 
  lineHeight: number = 1.2, 
  containerWidth: number = 400
): number {
  const avgCharWidth = fontSize * 0.6; // 估算字符宽度
  const charsPerLine = Math.floor(containerWidth / avgCharWidth);
  const estimatedLines = Math.ceil(text.length / charsPerLine);
  return Math.ceil(estimatedLines * fontSize * lineHeight);
}

const estimatedHeight = estimateTextHeight(content, 16, 1.2, 400);

const svg = await satori(content, {
  width: 400,
  height: estimatedHeight,
  fonts: [...],
});
```

## 实际使用建议

### 选择方法的依据：

1. **简单文本内容** → 使用方法一（`height: undefined`）
2. **需要精确高度控制** → 使用方法二（预渲染）
3. **性能敏感场景** → 使用方法三（预估计算）

### 注意事项：

1. **字体加载**：确保字体正确加载，否则高度计算可能不准确
2. **容器宽度**：宽度会影响文本换行，进而影响高度计算
3. **CSS 样式**：padding、margin 等样式会影响最终高度
4. **复杂布局**：对于包含图片、复杂嵌套的布局，推荐使用方法一或方法二

## 完整示例

查看 `server/modules/screenshot/screenshot.service.ts` 中的完整实现示例，包含了多种方法的对比演示。

## 相关资源

- [Satori GitHub Discussion #614](https://github.com/vercel/satori/discussions/614)
- [Satori 官方文档](https://github.com/vercel/satori)
- [@altano/satori-fit-text](https://www.npmjs.com/package/@altano/satori-fit-text) - 文本自适应库