import { WechatAuthModule } from './wechatAuth/wechat-auth.module';
import { UserModule } from './user/user.module';
import { RouterModule } from './router/router.module';
import { ScreenshotModule } from './screenshot/screenshot.module';

// 导出模块数组，RouterModule需要放到数组最后
export default [
  WechatAuthModule,
  UserModule,
  ScreenshotModule,

  // 最后导出RouterModule
  RouterModule,
];
