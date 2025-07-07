import { lazy } from 'react';
import type { IMenu } from '@src/interfaces/router.interface';
import { AppstoreOutlined } from '@ant-design/icons';
import type { RouteObject } from 'react-router-dom';

export const asyncRouteComponents = {
  Home: lazy(() => import(/* webpackChunkName: "Home" */ '@src/pages/Home')),
  Test: lazy(() => import(/* webpackChunkName: "Test" */ '@src/pages/Test')),
  Screenshot: lazy(
    () => import(/* webpackChunkName: "Screenshot" */ '@src/pages/Screenshot'),
  ),
};

export type RouteCompont = keyof typeof asyncRouteComponents;

export const menus: Array<IMenu<RouteCompont>> = [
  {
    path: 'screenshot',
    component: 'Screenshot',
    title: '截图',
    icon: <AppstoreOutlined />,
    key: '1',
  },
  {
    path: 'test',
    component: 'Test',
    title: '测试',
    icon: <AppstoreOutlined />,
    key: '2',
  },

  // {
  //   path: ':id/logs',
  //   component: 'Logs',
  //   title: '日志详情',
  //   icon: <AppstoreOutlined />,
  //   key: '2', // 子集key: 1-1、1-1-1  隐藏page为11 12 递增
  // },
];

const flatRouter = (
  list: Array<IMenu<RouteCompont>>,
): Array<Omit<IMenu<RouteCompont>, 'children'>> => {
  return list.reduce((items, { children, ...item }: any) => {
    const data = Array.isArray(children)
      ? [item, ...flatRouter(children)]
      : item;
    return items.concat(data);
  }, []);
};

// page 子路由
export const routesFlat = flatRouter(menus);

// 转换为 React Router v7 的 RouteObject 格式
const createRouteObject = (menu: IMenu<RouteCompont>): RouteObject => {
  const Component = menu.component && asyncRouteComponents[menu.component];

  const routeObject: RouteObject = {
    path: menu.path,
    element: Component ? <Component /> : null,
  };

  if (menu.children && menu.children.length > 0) {
    routeObject.children = menu.children.map(createRouteObject);
  }

  return routeObject;
};

// React Router v7 推荐的路由配置
export const routerConfig: RouteObject[] = [
  {
    path: '/page',
    Component: asyncRouteComponents.Home,
    children: routesFlat.map(createRouteObject),
  },
  {
    path: '/',
    Component: asyncRouteComponents.Home,
    children: routesFlat.map(createRouteObject),
  },
  {
    path: '*',
    Component: asyncRouteComponents.Home,
  },
];

// 保持向后兼容的路由配置
const routes: Array<IMenu<RouteCompont>> = [
  // {
  //   path: '/login',
  //   component: 'Login',
  //   title: '登录',
  // },
  {
    path: '/page',
    component: 'Home',
    title: '首页',
    children: routesFlat,
  },
  // {
  //   path: '/site',
  //   component: 'Site',
  //   title: '首页',
  // },

  // 如果这里放在前面，就会拦截其他相关的路由，所以这种路由都要放在最后
  {
    path: '/*',
    component: 'Home',
    title: '404',
  },
];

export default routes;
