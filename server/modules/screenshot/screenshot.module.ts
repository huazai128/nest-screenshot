import { Module } from '@nestjs/common';
import { ScreenshotController } from './screenshot.controller';
import { ScreenshotService } from './screenshot.service';
import { ReceiptService } from './receipt.service';

@Module({
  imports: [],
  controllers: [ScreenshotController],
  providers: [ScreenshotService, ReceiptService],
})
export class ScreenshotModule {}
