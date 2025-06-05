import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { menus, routesFlat, type RouteCompont } from '@src/routes';
import type { IMenu } from '@src/interfaces/router.interface';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import styles from './style.module.scss';
import globalStore from '@src/stores/GlobalStore';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  theme?: 'light' | 'dark',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    theme,
  } as MenuItem;
}

export interface IProps {
  sideBarCollapsed: boolean;
  sideBarTheme: 'light' | 'dark';
  navOpenKeys: string[];
  setOpenKeys: (openKeys: string[]) => void;
  history: History;
  siteId: string;
  selectedKeys: string[];
}

const loopItem = (item: IMenu<RouteCompont>): MenuItem => {
  const list = item.children?.map(loopItem) as MenuItem[];
  return getItem(item.title, item.key, item.icon, list);
};

const items: MenuItem[] = menus.map(loopItem);

const SiderMenu: React.FC = () => {
  // 使用 selector 优化，只订阅需要的状态
  const sideBarTheme = globalStore((state) => state.sideBarTheme);
  const selectedKeys = globalStore((state) => state.selectedKeys);

  // 分离 actions，避免不必要的重新渲染
  const getMenuProps = globalStore((state) => state.getMenuProps);
  const onSelected = globalStore((state) => state.onSelected);
  const updateSelectKey = globalStore((state) => state.updateSelectKey);

  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    updateSelectKey(location.pathname);
  }, [updateSelectKey, location.pathname]);

  const goPage: MenuProps['onClick'] = (e) => {
    if (id) {
      const key = e.key;
      const path = routesFlat.find((item) => item.key === key)?.path;
      const url = path?.replace(':id', id);
      url && navigate('/page/' + url);
    }
  };

  return (
    <Menu
      className={styles.menu}
      theme={sideBarTheme}
      mode="inline"
      onClick={goPage}
      items={items}
      selectedKeys={selectedKeys}
      onSelect={onSelected}
      {...getMenuProps()}
    />
  );
};

export default SiderMenu;
