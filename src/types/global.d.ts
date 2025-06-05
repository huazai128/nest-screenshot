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
    };
    wxConfig?: {
      appId: string;
      timestamp: number;
      nonceStr: string;
      signature: string;
    };
    wx?: any;
  }
}

export {};
