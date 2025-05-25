import { useState } from 'react';
import { Layout, Menu, Typography, theme, ConfigProvider } from 'antd';
import { AppstoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import NamespaceManager from './components/NamespaceManager/NamespaceManager';
import CertificateManager from './components/CertificateManager/CertificateManager';
import './App.css';
import { App as AntdApp } from 'antd';

const { Sider, Content } = Layout;
const { Title } = Typography;

enum MenuKey {
  Space = 'space',
  Cert = 'cert',
}

const MENU_ITEMS = [
  {
    key: MenuKey.Space,
    icon: <AppstoreOutlined />,
    label: '空间管理',
  },
  {
    key: MenuKey.Cert,
    icon: <SafetyCertificateOutlined />,
    label: '证书管理',
  },
];

function App() {
  const [activeMenu, setActiveMenu] = useState<MenuKey>(MenuKey.Space);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <AntdApp>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
          components: {
            Layout: {
              siderBg: '#ffffff',
              headerBg: '#ffffff',
            },
          },
        }}
      >
        <Layout style={{ height: '100vh' }}>
          <Sider
            theme="light"
            width={180}
            className="drag-region"
            style={{ borderRight: '1px solid #f0f0f0', paddingTop: '1rem' }}
          >
            <div
              style={{
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Title level={2} style={{ margin: 0, color: '#1890ff', userSelect: 'none' }}>
                CertMgr
              </Title>
            </div>
            <Menu
              className="no-drag-region"
              mode="inline"
              selectedKeys={[activeMenu]}
              items={MENU_ITEMS}
              onClick={({ key }) => setActiveMenu(key as MenuKey)}
            />
          </Sider>
          <Layout className="drag-region">
            <Content
              className="no-drag-region"
              style={{
                margin: '1.5rem',
                padding: '1.5rem',
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
                // overflow: 'hidden',
              }}
            >
              {activeMenu === MenuKey.Space && <NamespaceManager />}
              {activeMenu === MenuKey.Cert && <CertificateManager />}
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </AntdApp>
  );
}

export default App;
