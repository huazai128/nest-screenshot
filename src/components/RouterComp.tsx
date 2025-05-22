import { useEffect, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import routes, { asyncRouteComponents, type RouteCompont } from '@src/routes';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import type {
  RouterCompProps,
  IMenu,
  SwitchRouterProps,
} from '@src/interfaces/router.interface';

dayjs.locale('zh-cn');

export default function RouterComp(props: RouterCompProps) {
  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={props?.fallback ?? null}>
        <Router>
          <SwitchRouter onChange={props?.onChange} />
        </Router>
      </Suspense>
    </ConfigProvider>
  );
}

// 渲染单个路由项
const renderRouteItem = (item: IMenu<RouteCompont>) => {
  const Component = item?.component && asyncRouteComponents[item?.component];
  if (!Component) return null;

  // 如果有子路由，嵌套子路由
  return item.children?.length ? (
    <Route key={item.path} path={item.path} element={<Component />}>
      {renderRoutes(item.children)}
    </Route>
  ) : (
    <Route key={item.path} path={item.path} element={<Component />} />
  );
};

// 递归渲染路由列表， Routes 下子组件只支持Route
const renderRoutes = (
  routeList?: Array<IMenu<RouteCompont>>,
): React.ReactNode => {
  return routeList?.map(renderRouteItem);
};

export const SwitchRouter = ({ onChange }: SwitchRouterProps) => {
  const location = useLocation();

  useEffect(() => {
    onChange?.();
  }, [location, onChange]);

  return (
    <Layout className="site-layout">
      <Layout className="site-content">
        <Routes>{renderRoutes(routes)}</Routes>
      </Layout>
    </Layout>
  );
};
