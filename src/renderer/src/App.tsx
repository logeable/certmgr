import { useState } from 'react';
import Layout from './components/Layout/Layout';
import Sidebar, { MenuItem } from './components/Sidebar/Sidebar';
import NamespaceManager from './components/NamespaceManager/NamespaceManager';
import CertificateManager from './components/CertificateManager/CertificateManager';

const MENU: MenuItem[] = [
  { key: 'space', label: '空间管理' },
  { key: 'cert', label: '证书管理' },
];

function App() {
  const [activeMenu, setActiveMenu] = useState<'space' | 'cert'>('space');

  return (
    <Layout
      sidebar={
        <Sidebar
          menu={MENU}
          activeKey={activeMenu}
          onChange={key => setActiveMenu(key as 'space' | 'cert')}
        />
      }
    >
      {activeMenu === 'space' && <NamespaceManager />}
      {activeMenu === 'cert' && <CertificateManager />}
    </Layout>
  );
}

export default App;
