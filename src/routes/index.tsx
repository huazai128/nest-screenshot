import { lazy } from 'react';
import type { IMenu } from '@src/interfaces/router.interface';
export const asyncRouteComponents = {
  Home: lazy(() => import(/* webpackChunkName: "Home" */ '@src/pages/Home')),
};

export type RouteCompont = keyof typeof asyncRouteComponents;

export const menus: Array<IMenu<RouteCompont>> = [
  // {
  //   path: ':id/home',
  //   component: 'DataVerview',
  //   title: '总览',
  //   icon: <AppstoreOutlined />,
  //   key: '1', // 子集key: 1-1、1-1-1  隐藏page为11 12 递增
  // },
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
