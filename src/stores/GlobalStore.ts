import { create } from 'zustand';
import { combine, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import * as STORE_KEY from '@src/constants/storeKey.constant';
import { routesFlat } from '@src/routes';
import { pathToRegexp } from 'path-to-regexp';
import type { SideBarTheme } from '@src/interfaces/global.interface';

/**
 * 用户信息接口
 */
interface UserInfo {
  id?: string;
  name?: string;
  avatar?: string;
  token?: string;
}

/**
 * 全局状态接口
 */
interface GlobalStoreState {
  user: UserInfo; // 用户信息
  isWx: boolean; // 是否微信环境
  isApp: boolean; // 是否App环境
  isDev: boolean; // 是否开发环境
  isProd: boolean; // 是否生产环境
  sideBarCollapsed: boolean; // 侧边栏是否折叠
  navOpenKeys: string[]; // 导航展开的键值
  sideBarTheme: SideBarTheme; // 侧边栏主题
  selectedKeys: string[]; // 选中的菜单键值
}

/**
 * 全局状态操作方法接口
 */
interface GlobalStoreActions {
  getMenuProps: () => any; // 获取菜单属性
  setUser: (user: UserInfo) => void; // 设置用户信息
  clearUser: () => void; // 清除用户信息
  toggleSideBarCollapsed: () => void; // 切换侧边栏折叠状态
  changeSiderTheme: (theme: SideBarTheme) => void; // 更改侧边栏主题
  setOpenKeys: (openKeys: string[]) => void; // 设置展开的菜单键值
  onSelected: (params: { selectedKeys: string[] }) => void; // 菜单选中事件
  updateSelectKey: (pathname: string) => void; // 根据路径更新选中的菜单
  updateSite: (siteId: string) => void; // 更新站点ID
}

/**
 * 全局Store类型定义
 */
type GlobalStore = GlobalStoreState & GlobalStoreActions;

/**
 * 获取初始主题设置
 * @returns 侧边栏主题
 */
const getInitialTheme = (): SideBarTheme => {
  const theme = localStorage.getItem(STORE_KEY.SIDE_BAR_THEME) as SideBarTheme;
  return theme || 'light';
};

/**
 * 获取初始选中的菜单键值
 * @returns 菜单键值数组
 */
const getInitialKeys = (): string[] => {
  const keys = localStorage.getItem(STORE_KEY.SELECTED_KEY);
  return (keys && JSON.parse(keys)) || ['1-1-1'];
};

/**
 * 获取初始侧边栏折叠状态
 * @returns 是否折叠
 */
const getInitialCollapsed = (): boolean => {
  return localStorage.getItem(STORE_KEY.SIDE_BAR_COLLAPSED) === '1';
};

/**
 * 获取初始展开的导航键值
 * @returns 导航键值数组
 */
const getInitialOpenKeys = (): string[] => {
  return JSON.parse(localStorage.getItem(STORE_KEY.NAV_OPEN_KEYS) || '[]');
};

/**
 * 全局状态管理store
 * 使用zustand进行状态管理
 * 集成了devtools用于开发调试
 * 使用immer简化状态更新
 * 使用combine分离状态和方法
 */
const globalStore = create<GlobalStore>()(
  devtools(
    immer(
      combine(
        // 状态定义
        {
          // 原有用户信息
          user: (window.INIT_DATA?.userInfo || {}) as UserInfo,
          isWx: window.INIT_DATA?.isWx || false,
          isApp: window.INIT_DATA?.isApp || false,
          isDev: window.INIT_DATA?.isDev || false,
          isProd: window.INIT_DATA?.isProd || false,

          // 新增的状态
          sideBarCollapsed: getInitialCollapsed(),
          navOpenKeys: getInitialOpenKeys(),
          sideBarTheme: getInitialTheme(),
          selectedKeys: getInitialKeys(),
        },
        // 方法定义
        (set, get) => ({
          /**
           * 获取菜单属性
           * 当侧边栏折叠时返回空对象，否则返回包含展开事件和展开键值的对象
           */
          getMenuProps: () => {
            const state = get();
            if (state.sideBarCollapsed) return {};

            return {
              onOpenChange: (openKeys: string[]) => {
                set((state) => {
                  state.navOpenKeys = openKeys;
                  localStorage.setItem(
                    STORE_KEY.NAV_OPEN_KEYS,
                    JSON.stringify(openKeys),
                  );
                });
              },
              openKeys: state.navOpenKeys,
            };
          },

          /**
           * 设置用户信息
           * @param user 用户信息对象
           */
          setUser: (user: UserInfo) =>
            set((state) => {
              state.user = user;
            }),

          /**
           * 清除用户信息
           * 将用户信息重置为空对象
           */
          clearUser: () =>
            set((state) => {
              state.user = {};
            }),

          /**
           * 切换侧边栏折叠状态
           * 同时将状态保存到localStorage
           */
          toggleSideBarCollapsed: () =>
            set((state) => {
              state.sideBarCollapsed = !state.sideBarCollapsed;
              localStorage.setItem(
                STORE_KEY.SIDE_BAR_COLLAPSED,
                state.sideBarCollapsed ? '1' : '0',
              );
            }),

          /**
           * 更改侧边栏主题
           * @param theme 主题类型
           */
          changeSiderTheme: (theme: SideBarTheme) =>
            set((state) => {
              state.sideBarTheme = theme;
              localStorage.setItem(STORE_KEY.SIDE_BAR_THEME, theme);
            }),

          /**
           * 设置展开的菜单键值
           * @param openKeys 展开的键值数组
           */
          setOpenKeys: (openKeys: string[]) =>
            set((state) => {
              state.navOpenKeys = openKeys;
              localStorage.setItem(
                STORE_KEY.NAV_OPEN_KEYS,
                JSON.stringify(openKeys),
              );
            }),

          /**
           * 菜单选中事件处理
           * @param params 包含选中键值的参数对象
           */
          onSelected: ({ selectedKeys }: { selectedKeys: string[] }) =>
            set((state) => {
              state.selectedKeys = selectedKeys;
              localStorage.setItem(
                STORE_KEY.SELECTED_KEY,
                JSON.stringify(selectedKeys),
              );
            }),

          /**
           * 根据路径更新选中的菜单键值
           * 通过路径匹配找到对应的菜单项并更新选中状态
           * @param pathname 当前路径
           */
          updateSelectKey: (pathname: string) =>
            set((state) => {
              const key = (routesFlat.find((item) => {
                if (!item.path) return false;
                try {
                  const { regexp } = pathToRegexp(`/page/${item.path}`);
                  return regexp.exec(pathname) !== null;
                } catch {
                  return false;
                }
              })?.key || '1') as string;
              state.selectedKeys = [key];
              localStorage.setItem(
                STORE_KEY.SELECTED_KEY,
                JSON.stringify([key]),
              );
            }),

          /**
           * 更新站点ID
           * @param siteId 站点ID
           */
          updateSite: (siteId: string) =>
            set((state) => {
              state.siteId = siteId;
            }),
        }),
      ),
    ),
    {
      name: 'GlobalStore',
    },
  ),
);

export default globalStore;
