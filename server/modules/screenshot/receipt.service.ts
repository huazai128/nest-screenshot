import { Injectable } from '@nestjs/common';
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as path from 'path';
import { createLogger } from '@app/utils/logger';
import crypto from 'crypto';
import { CacheService } from '@app/processors/redis/cache.service';

const Logger = createLogger({
  scope: 'ReceiptService',
});

// 收据数据接口
interface ReceiptData {
  receiptNo: string;
  parkingSpot: string;
  owner: string;
  area: string;
  issueTime: string;
  items: ReceiptItem[];
  totalAmount: number;
  collector: string;
  collectTime: string;
  paymentMethod: string;
}

interface ReceiptItem {
  category: string;
  description: string;
  startTime: string;
  endTime: string;
  unitPrice: string;
  receivable: number;
  discount: number;
  penalty: number;
  actualAmount: number;
}

// Redis缓存接口定义
interface ReceiptCacheData {
  filePath: string;
  timestamp: number;
  config: any;
  fileSize: number;
}

/**
 * 收据生成服务
 * 使用satori生成高质量的收据截图
 * 采用与ScreenshotService相同的高性能架构
 * 支持中文、缓存、扁平化DOM等优化
 */
@Injectable()
export class ReceiptService {
  private fontCache: Map<string, Buffer> = new Map();
  private readonly cacheExpirationMs = 24 * 60 * 60 * 1000; // 24小时过期
  private readonly cacheKeyPrefix = 'receipt:cache:'; // Redis缓存键前缀

  constructor(private readonly cacheService: CacheService) {
    this.loadFonts();
    setTimeout(() => {
      this.generateReceipt(); // 执行性能对比测试
    }, 1000);
  }

  /**
   * 生成Redis缓存键
   */
  private getCacheKey(configHash: string): string {
    return `${this.cacheKeyPrefix}${configHash}`;
  }

  /**
   * 生成配置的MD5哈希值用于缓存键
   */
  private generateConfigHash(config: any): string {
    const configString = JSON.stringify(config);
    return crypto.createHash('md5').update(configString).digest('hex');
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(cache: ReceiptCacheData): boolean {
    const now = Date.now();
    return (
      now - cache.timestamp < this.cacheExpirationMs &&
      existsSync(cache.filePath)
    );
  }

  /**
   * 从Redis获取收据缓存
   */
  private async getFromCache(
    configHash: string,
  ): Promise<ReceiptCacheData | null> {
    try {
      const cacheKey = this.getCacheKey(configHash);
      const cacheData = await this.cacheService.get<ReceiptCacheData>(cacheKey);

      if (cacheData && this.isCacheValid(cacheData)) {
        Logger.log(`🎯 Redis缓存命中: ${cacheKey}`);
        return cacheData;
      }

      // 清理过期或无效缓存
      if (cacheData) {
        await this.cacheService.delete(cacheKey);
        Logger.log(`🗑️  清理过期缓存: ${cacheKey}`);
      }

      return null;
    } catch (error) {
      Logger.error('获取Redis缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存到Redis缓存
   */
  private async saveToCache(
    configHash: string,
    filePath: string,
    config: any,
    fileSize: number,
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(configHash);
      const cacheData: ReceiptCacheData = {
        filePath,
        timestamp: Date.now(),
        config,
        fileSize,
      };

      // 设置24小时TTL
      const ttlSeconds = Math.floor(this.cacheExpirationMs / 1000);
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(cacheData),
        ttlSeconds,
      );

      Logger.log(`💾 已保存到Redis缓存: ${cacheKey} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      Logger.error('保存Redis缓存失败:', error);
    }
  }

  /**
   * 加载字体文件
   */
  private loadFonts(): void {
    if (this.fontCache.size === 0) {
      try {
        // 加载支持中文的 Source Han Sans 字体
        const sourceHanPath = path.join(
          process.cwd(),
          'server/assets/SourceHanSansSC-Regular.ttf',
        );

        if (existsSync(sourceHanPath)) {
          const sourceHanBuffer = readFileSync(sourceHanPath);
          if (this.isValidFontBuffer(sourceHanBuffer)) {
            this.fontCache.set('Source Han Sans SC', sourceHanBuffer);
            Logger.log('✅ Source Han Sans SC 字体加载成功');
          }
        }

        // 加载英文字体作为后备
        const robotoPath = path.join(
          process.cwd(),
          'server/assets/Roboto-Regular.ttf',
        );

        if (existsSync(robotoPath)) {
          const robotoBuffer = readFileSync(robotoPath);
          if (this.isValidFontBuffer(robotoBuffer)) {
            this.fontCache.set('Roboto', robotoBuffer);
            Logger.log('✅ Roboto 字体加载成功');
          }
        }

        // 确保至少有一个字体可用
        if (this.fontCache.size === 0) {
          const habboPath = path.join(process.cwd(), 'server/assets/Habbo.ttf');
          if (existsSync(habboPath)) {
            const habboBuffer = readFileSync(habboPath);
            if (this.isValidFontBuffer(habboBuffer)) {
              this.fontCache.set('Habbo', habboBuffer);
              Logger.log('✅ Habbo 字体加载成功（作为后备字体）');
            }
          }
        }

        Logger.log(
          '✅ 字体加载完成，可用字体:',
          Array.from(this.fontCache.keys()),
        );
      } catch (error) {
        Logger.error('❌ 字体加载失败:', error);
      }

      if (this.fontCache.size === 0) {
        throw new Error('没有任何有效的字体文件可用，无法生成收据');
      }
    }
  }

  /**
   * 验证字体文件是否为有效的 TTF/OTF 格式
   */
  private isValidFontBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    const validSignatures = [
      '\x00\x01\x00\x00', // TrueType
      'OTTO', // OpenType with CFF
      'true', // TrueType (legacy)
      'typ1', // PostScript Type 1
    ];

    return validSignatures.some((sig) =>
      buffer.slice(0, 4).equals(Buffer.from(sig, 'binary')),
    );
  }

  /**
   * 生成收据截图
   */
  async generateReceipt(data?: Partial<ReceiptData>): Promise<string> {
    const startTime = Date.now();
    Logger.log('🧾 开始生成收据截图...');

    // 默认收据数据
    const defaultData: ReceiptData = {
      receiptNo: '38000025798',
      parkingSpot: '1211',
      owner: '车位面积: 123m²',
      area: '123m²',
      issueTime: '2025-07-10 15:21',
      items: [
        {
          category: '资源',
          description: '其他',
          startTime: '2025-02',
          endTime: '2025-06',
          unitPrice: '0.01元/月',
          receivable: 0.05,
          discount: 0,
          penalty: 0,
          actualAmount: 0.05,
        },
      ],
      totalAmount: 0.05,
      collector: '西安络谱源贸易有限公司',
      collectTime: '2025-07-10 15:21:27',
      paymentMethod: '支付宝',
    };

    // 合并用户数据
    const receiptData = { ...defaultData, ...data };

    // 生成配置哈希用于缓存
    const configHash = this.generateConfigHash(receiptData);
    const fileName = `receipt-${configHash.substring(0, 8)}.png`;

    // 检查缓存
    const cached = await this.getFromCache(configHash);
    if (cached) {
      Logger.log('🎯 命中缓存！直接使用已生成的收据');
      Logger.log(`✅ 缓存收据路径: ${cached.filePath}`);
      Logger.log(`⏱️  缓存性能: 总耗时 ${Date.now() - startTime}ms (缓存命中)`);
      return cached.filePath;
    }

    this.loadFonts();

    // 构建收据的扁平化DOM结构
    const element = this.buildReceiptElement(receiptData);

    // 准备字体配置
    const fonts: Array<{
      name: string;
      weight: 400;
      style: 'normal';
      data: Buffer;
    }> = [];

    for (const [name, data] of this.fontCache.entries()) {
      fonts.push({
        name,
        weight: 400,
        style: 'normal',
        data,
      });
    }

    const satoriOptions: any = {
      width: 800,
      height: undefined, // 自动计算高度
    };

    if (fonts.length > 0) {
      satoriOptions.fonts = fonts;
    }

    // 生成SVG
    const svgStartTime = Date.now();
    const svg = await satori(element as any, satoriOptions);
    const svgEndTime = Date.now();
    const svgDuration = svgEndTime - svgStartTime;

    // 转换为PNG
    const pngStartTime = Date.now();
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const pngEndTime = Date.now();
    const pngDuration = pngEndTime - pngStartTime;

    // 保存文件
    writeFileSync(fileName, pngBuffer);

    // 保存到缓存
    const fileSizeKB = Math.round(pngBuffer.length / 1024);
    await this.saveToCache(configHash, fileName, receiptData, fileSizeKB);

    const totalDuration = Date.now() - startTime;

    Logger.log(`✅ 收据生成成功！文件保存为 ${fileName}`);
    Logger.log(
      `⏱️  性能统计: 总耗时 ${totalDuration}ms | SVG生成 ${svgDuration}ms | PNG转换 ${pngDuration}ms | 文件大小 ${fileSizeKB}KB`,
    );

    return fileName;
  }

  /**
   * 构建收据的DOM元素结构
   */
  private buildReceiptElement(data: ReceiptData): any {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: 760,
          padding: 20,
          backgroundColor: '#ffffff',
          fontFamily: 'Source Han Sans SC, Roboto, Habbo, sans-serif',
          color: '#333333',
          border: '1px solid #000000',
        },
        children: [
          // 头部
          this.buildHeader(data),
          // 基本信息
          this.buildBasicInfo(data),
          // 表格
          this.buildTable(data),
          // 底部信息
          this.buildFooter(data),
        ],
      },
    };
  }

  /**
   * 构建收据头部
   */
  private buildHeader(data: ReceiptData): any {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '2px solid #333333',
          paddingBottom: 10,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: 40,
                      height: 40,
                      backgroundColor: '#4a90e2',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: 'bold',
                    },
                    children: '花',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 18,
                      fontWeight: 'bold',
                    },
                    children: '花伴住京市汽车修理厂',
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 24,
                      fontWeight: 'bold',
                      color: '#d32f2f',
                    },
                    children: '收据',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 14,
                      marginTop: 5,
                    },
                    children: `No: ${data.receiptNo}`,
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }

  /**
   * 构建基本信息
   */
  private buildBasicInfo(data: ReceiptData): any {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20,
          fontSize: 14,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: 30,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    children: `车位：${data.parkingSpot}`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    children: `业主：${data.owner}`,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              children: `开票时间：${data.issueTime}`,
            },
          },
        ],
      },
    };
  }

  /**
   * 构建表格
   */
  private buildTable(data: ReceiptData): any {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #000000',
          marginBottom: 20,
        },
        children: [
          // 表头
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                borderBottom: '1px solid #000000',
                backgroundColor: '#f5f5f5',
              },
              children: [
                this.buildTableCell('资源', 60, true),
                this.buildTableCell('收费', 60, true),
                this.buildTableCell('收费', 60, true),
                this.buildTableCell('计费开始/结束时间', 120, true),
                this.buildTableCell('应收金额', 80, true),
                this.buildTableCell('优惠', 50, true),
                this.buildTableCell('违约金', 60, true),
                this.buildTableCell('应收金额', 80, true),
                this.buildTableCell('账单备注', 100, true),
              ],
            },
          },
          // 数据行
          ...data.items.map((item) => ({
            type: 'div',
            props: {
              style: {
                display: 'flex',
                borderBottom: '1px solid #000000',
              },
              children: [
                this.buildTableCell(item.category, 60),
                this.buildTableCell(item.description, 60),
                this.buildTableCell(item.unitPrice, 60),
                this.buildTableCell(`${item.startTime}至${item.endTime}`, 120),
                this.buildTableCell(item.receivable.toFixed(2), 80),
                this.buildTableCell(item.discount.toString(), 50),
                this.buildTableCell(item.penalty.toString(), 60),
                this.buildTableCell(item.actualAmount.toFixed(2), 80),
                this.buildTableCell('', 100),
              ],
            },
          })),
          // 合计行
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                backgroundColor: '#f5f5f5',
                fontWeight: 'bold',
              },
              children: [
                this.buildTableCell('实收金额合计（大写）：', 300),
                this.buildTableCell('伍分', 200),
                this.buildTableCell(`${data.totalAmount.toFixed(2)}元`, 100),
              ],
            },
          },
        ],
      },
    };
  }

  /**
   * 构建表格单元格
   */
  private buildTableCell(
    content: string,
    width: number,
    isHeader = false,
  ): any {
    return {
      type: 'div',
      props: {
        style: {
          width: width,
          padding: '8px 4px',
          fontSize: 12,
          textAlign: 'center',
          borderRight: '1px solid #000000',
          fontWeight: isHeader ? 'bold' : 'normal',
          backgroundColor: isHeader ? '#f5f5f5' : 'transparent',
        },
        children: content,
      },
    };
  }

  /**
   * 构建底部信息
   */
  private buildFooter(data: ReceiptData): any {
    return {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontSize: 12,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    children: `收款：${data.collector}`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    children: `收款人：99001改变潮流，约下载`,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    children: `收款时间：${data.collectTime}`,
                  },
                },
                {
                  type: 'div',
                  props: {
                    children: `收款备注：-`,
                  },
                },
                // 印章
                {
                  type: 'div',
                  props: {
                    style: {
                      width: 60,
                      height: 60,
                      border: '2px solid #d32f2f',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#d32f2f',
                      fontSize: 10,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    },
                    children: '★\n财务专用章',
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }
}
