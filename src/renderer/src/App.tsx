import { useState } from 'react';
import { Layout, Menu, Typography, theme, ConfigProvider } from 'antd';
import { AppstoreOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import NamespaceManager from './components/NamespaceManager/NamespaceManager';
import CertificateManager from './components/CertificateManager/CertificateManager';

const { Sider, Header, Content } = Layout;
const { Title } = Typography;

const MENU_ITEMS = [
  {
    key: 'space',
    icon: <AppstoreOutlined />,
    label: '空间管理',
  },
  {
    key: 'cert',
    icon: <SafetyCertificateOutlined />,
    label: '证书管理',
  },
];

function App() {
  const [activeMenu, setActiveMenu] = useState<'space' | 'cert'>('space');
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
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
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          width={240}
          style={{
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
              background: '#fafafa',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#1890ff', fontWeight: 600 }}>
              {collapsed ? 'CM' : 'CertMgr'}
            </Title>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            items={MENU_ITEMS}
            onClick={({ key }) => setActiveMenu(key as 'space' | 'cert')}
            style={{
              borderRight: 0,
              fontSize: '14px',
            }}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: colorBgContainer,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            }}
          >
            <Title level={3} style={{ margin: 0, color: '#262626' }}>
              {MENU_ITEMS.find(item => item.key === activeMenu)?.label}
            </Title>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              boxShadow:
                '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
            }}
          >
            {activeMenu === 'space' && <NamespaceManager />}
            {activeMenu === 'cert' && <CertificateManager />}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
