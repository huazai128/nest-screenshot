declare namespace IGlobalStore {
  export type SideBarTheme = 'light' | 'dark';

  export interface CategoryItem {
    id: string;
    name: string;
    value?: any;
  }
}

declare global {
  interface Window {
    INIT_DATA?: {
      apiHost: string;
      wechatLoginUrl?: string;
      openId?: string;
      userInfo?: {
        name: string;
        userId: string;
      };
      isWx: boolean;
      isApp: boolean;
      isDev: boolean;
      isProd: boolean;
      isIOS: boolean;
      isAndroid: boolean;
      _id?: string;
      categoryList?: Array<IGlobalStore.CategoryItem>;
    };
    wxConfig?: {
      appId: string;
      timestamp: number;
      nonceStr: string;
      signature: string;
    };
    wx?: any;
  }

  class WxLogin {
    constructor(config: {
      self_redirect: boolean;
      id: string;
      appid: string;
      scope: string;
      redirect_uri: string;
      state: string;
      style?: string;
      href?: string;
      fast_login?: number;
    });
  }
}

export {};

declare module 'worker-loader!*.ts' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string };
  export = classes;
}

declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export = classes;
}
