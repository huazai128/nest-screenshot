import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ScreenshotService } from './screenshot.service';
import { ReceiptService } from './receipt.service';
import { existsSync } from 'fs';
import { join } from 'path';

// 收据数据DTO
export class ReceiptDataDto {
  receiptNo?: string;
  parkingSpot?: string;
  owner?: string;
  area?: string;
  issueTime?: string;
  items?: Array<{
    category: string;
    description: string;
    startTime: string;
    endTime: string;
    unitPrice: string;
    receivable: number;
    discount: number;
    penalty: number;
    actualAmount: number;
  }>;
  totalAmount?: number;
  collector?: string;
  collectTime?: string;
  paymentMethod?: string;
}

@Controller('screenshot')
export class ScreenshotController {
  constructor(
    private readonly screenshotService: ScreenshotService,
    private readonly receiptService: ReceiptService,
  ) {}

  /**
   * 生成收据截图
   * @param receiptData 收据数据（可选）
   * @returns 生成的收据图片文件路径
   */
  @Post('receipt')
  async generateReceipt(@Body() receiptData?: ReceiptDataDto): Promise<{
    success: boolean;
    filePath: string;
    message: string;
  }> {
    try {
      const filePath = await this.receiptService.generateReceipt(receiptData);
      return {
        success: true,
        filePath,
        message: '收据生成成功',
      };
    } catch (error: any) {
      return {
        success: false,
        filePath: '',
        message: `收据生成失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取收据图片文件
   * @param filePath 文件路径
   * @param res Express响应对象
   */
  @Get('receipt/file/:fileName')
  async getReceiptFile(
    @Res() res: Response,
    @Body('fileName') fileName: string,
  ): Promise<void> {
    try {
      const filePath = join(process.cwd(), fileName);

      if (!existsSync(filePath)) {
        res.status(404).json({ error: '文件不存在' });
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.sendFile(filePath);
    } catch {
      res.status(500).json({ error: '获取文件失败' });
    }
  }

  /**
   * 生成基础截图（原有功能）
   */
  @Post('generate')
  async generateScreenshot(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.screenshotService.getScreenshot();
      return {
        success: true,
        message: '截图生成成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `截图生成失败: ${error.message}`,
      };
    }
  }

  /**
   * 生成图标截图（原有功能）
   */
  @Post('icons')
  async generateIconsScreenshot(
    @Body('batchSize') batchSize: number = 6,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await this.screenshotService.generateWithLocalIcons(batchSize);
      return {
        success: true,
        message: '图标截图生成成功',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `图标截图生成失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取缓存统计信息
   */
  @Get('cache/stats')
  async getCacheStats(): Promise<{
    success: boolean;
    data: any;
  }> {
    try {
      const stats = await this.screenshotService.getCacheStats();
      return {
        success: true,
        data: stats,
      };
    } catch {
      return {
        success: false,
        data: null,
      };
    }
  }

  /**
   * 清理所有缓存
   */
  @Post('cache/clear')
  async clearCache(): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
  }> {
    try {
      const deletedCount = await this.screenshotService.clearAllCache();
      return {
        success: true,
        deletedCount,
        message: `已清理 ${deletedCount} 个缓存`,
      };
    } catch (error: any) {
      return {
        success: false,
        deletedCount: 0,
        message: `清理缓存失败: ${error.message}`,
      };
    }
  }
}
