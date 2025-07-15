# 收据生成API使用说明

## 概述

本项目已集成高性能的收据生成功能，使用与 `screenshot.service.ts` 相同的架构：

- ✅ 使用 satori 生成 SVG，sharp 转换为 PNG
- ✅ Redis 缓存机制，提升性能
- ✅ 扁平化 DOM 结构，减少渲染复杂度
- ✅ 支持中文字体
- ✅ 完全模拟原图片的收据样式

## API 端点

### 1. 生成收据

**POST** `/screenshot/receipt`

生成一张收据快照图片。

#### 请求体（可选）

```json
{
  "receiptNo": "38000025798",
  "parkingSpot": "1211",
  "owner": "张三",
  "area": "123m²",
  "issueTime": "2025-07-10 15:21",
  "items": [
    {
      "category": "资源",
      "description": "其他",
      "startTime": "2025-02",
      "endTime": "2025-06",
      "unitPrice": "0.01元/月",
      "receivable": 0.05,
      "discount": 0,
      "penalty": 0,
      "actualAmount": 0.05
    }
  ],
  "totalAmount": 0.05,
  "collector": "西安络谱源贸易有限公司",
  "collectTime": "2025-07-10 15:21:27",
  "paymentMethod": "支付宝"
}
```

#### 响应

```json
{
  "success": true,
  "filePath": "receipt-a1b2c3d4.png",
  "message": "收据生成成功"
}
```

### 2. 获取收据图片

**GET** `/screenshot/receipt/file/:fileName`

获取生成的收据图片文件。

#### 参数

- `fileName`: 收据文件名（从生成API返回）

#### 响应

返回 PNG 图片文件。

## 使用示例

### 1. 生成默认收据

```bash
curl -X POST http://localhost:3000/screenshot/receipt \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. 生成自定义收据

```bash
curl -X POST http://localhost:3000/screenshot/receipt \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNo": "12345678901",
    "parkingSpot": "A001",
    "owner": "张三",
    "area": "150m²",
    "issueTime": "2024-01-15 10:30:00",
    "items": [
      {
        "category": "停车费",
        "description": "月租",
        "startTime": "2024-01",
        "endTime": "2024-02",
        "unitPrice": "200元/月",
        "receivable": 200,
        "discount": 20,
        "penalty": 0,
        "actualAmount": 180
      }
    ],
    "totalAmount": 180,
    "collector": "某某物业管理公司",
    "collectTime": "2024-01-15 10:30:25",
    "paymentMethod": "微信支付"
  }'
```

### 3. 查看生成的收据

```bash
curl http://localhost:3000/screenshot/receipt/file/receipt-a1b2c3d4.png \
  --output receipt.png
```

## 其他API端点

### 生成基础截图

**POST** `/screenshot/generate`

生成基础测试截图。

### 生成图标截图

**POST** `/screenshot/icons`

```json
{
  "batchSize": 6
}
```

### 获取缓存统计

**GET** `/screenshot/cache/stats`

### 清理缓存

**POST** `/screenshot/cache/clear`

## 性能特性

1. **智能缓存**: 相同配置的收据会被缓存24小时，大幅提升性能
2. **扁平化DOM**: 减少DOM嵌套层级，提升渲染效率
3. **固定布局**: 避免动态计算，提升生成速度
4. **字体优化**: 支持中文字体，确保收据内容正确显示
5. **文件管理**: 生成的图片文件会被自动管理和清理

## 注意事项

1. 生成的收据图片文件会保存在项目根目录
2. 缓存机制使用 Redis，确保 Redis 服务正常运行
3. 支持多种字体格式，优先使用 Source Han Sans SC 中文字体
4. 所有时间格式建议使用 ISO 8601 格式或 `YYYY-MM-DD HH:mm:ss` 格式

## 错误处理

API 会返回详细的错误信息，便于调试：

```json
{
  "success": false,
  "filePath": "",
  "message": "收据生成失败: 具体错误信息"
}
```

## 扩展性

收据样式可以通过修改 `receipt.service.ts` 中的 `buildReceiptElement` 方法来自定义：

- 调整表格结构
- 修改样式配色
- 添加新的字段
- 调整布局排版 