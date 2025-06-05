import { Suspense } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sider from './Sider';
import styles from './index.module.scss';
const { Content } = Layout;

const Home = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };
  return (
    <>
      <Layout.Header className="site-header">
        <h4
          style={{ color: '#fff', fontSize: '16px', cursor: 'pointer' }}
          onClick={goHome}
        >
          管理后台
        </h4>
      </Layout.Header>
      <Layout className="site-content">
        <Layout>
          <Sider />
          <Layout>
            <Content className={styles.app}>
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </>
  );
};

export default Home;
