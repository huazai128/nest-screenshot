import { Controller } from '@nestjs/common';
import { ScreenshotService } from './screenshot.service';

@Controller('screenshot')
export class ScreenshotController {
  constructor(private readonly screenshotService: ScreenshotService) {}
}
