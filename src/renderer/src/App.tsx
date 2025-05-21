import { useState } from 'react';
import styles from './App.module.css';

const MENU = [
  { key: 'space', label: '空间管理' },
  { key: 'cert', label: '证书管理' },
];

function App() {
  const [activeMenu, setActiveMenu] = useState<'space' | 'cert'>('space');

  return (
    <div className={styles.container}>
      {/* 左侧菜单栏 */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>CertMgr</div>
        <ul className={styles.menu}>
          {MENU.map(item => (
            <li
              key={item.key}
              className={styles['menu-item'] + (activeMenu === item.key ? ' ' + styles.active : '')}
              onClick={() => setActiveMenu(item.key as 'space' | 'cert')}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      {/* 右侧主内容区 */}
      <main className={styles.main}>
        {activeMenu === 'space' && (
          <div>
            <h2 className={styles['section-title']}>空间管理</h2>
            {/* 这里后续可插入空间管理表格等内容 */}
            <div style={{ color: '#888' }}>空间管理内容区（待实现）</div>
          </div>
        )}
        {activeMenu === 'cert' && (
          <div>
            <h2 className={styles['section-title']}>证书管理</h2>
            {/* 这里后续可插入证书树等内容 */}
            <div style={{ color: '#888' }}>证书管理内容区（待实现）</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
