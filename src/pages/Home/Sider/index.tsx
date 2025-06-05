import { useMemo } from 'react';
import classnames from 'classnames';
import { Layout, Switch } from 'antd';
import { MenuFoldOutlined } from '@ant-design/icons';
import styles from './style.module.scss';
import SiderMenu from './Menu';
import globalStore from '@src/stores/GlobalStore';

const Sider: React.FC = () => {
  // 使用 selector 优化，只订阅需要的状态
  const sideBarCollapsed = globalStore((state) => state.sideBarCollapsed);
  const sideBarTheme = globalStore((state) => state.sideBarTheme);

  // 分离 actions，避免不必要的重新渲染
  const changeSiderTheme = globalStore((state) => state.changeSiderTheme);
  const toggleSideBarCollapsed = globalStore(
    (state) => state.toggleSideBarCollapsed,
  );

  // 直接定义事件处理函数，不使用缓存
  const handleThemeChange = (val: boolean) =>
    changeSiderTheme(val ? 'dark' : 'light');

  // 使用 useMemo 缓存复杂的 JSX 元素
  const ChangeTheme = useMemo(
    () => (
      <div
        className={classnames(
          styles.changeTheme,
          sideBarTheme === 'dark' && styles.dark,
          'fs-12',
        )}
      >
        切换主题
        <Switch
          checkedChildren="dark"
          unCheckedChildren="light"
          checked={sideBarTheme === 'dark'}
          onChange={handleThemeChange}
        />
      </div>
    ),
    [sideBarTheme, handleThemeChange],
  );

  // 缓存 logo 区域的 className
  const logoClassName = useMemo(
    () => classnames(styles.logoBox, sideBarTheme === 'dark' && styles.dark),
    [sideBarTheme],
  );

  return (
    <Layout.Sider
      className={styles.siderBox}
      trigger={null}
      theme={sideBarTheme}
      collapsible
      collapsed={sideBarCollapsed}
    >
      <div className={logoClassName}>
        <MenuFoldOutlined onClick={toggleSideBarCollapsed} />
      </div>
      <SiderMenu />
      {!sideBarCollapsed && ChangeTheme}
    </Layout.Sider>
  );
};

export default Sider;
