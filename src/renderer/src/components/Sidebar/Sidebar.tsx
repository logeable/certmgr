import styles from './Sidebar.module.css';

export interface MenuItem {
  key: string;
  label: string;
}

interface SidebarProps {
  menu: MenuItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Sidebar({ menu, activeKey, onChange }: SidebarProps) {
  return (
    <>
      <div className={styles.logo}>CertMgr</div>
      <ul className={styles.menu}>
        {menu.map(item => (
          <li
            key={item.key}
            className={styles['menu-item'] + (activeKey === item.key ? ' ' + styles.active : '')}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </>
  );
}
