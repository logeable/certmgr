import { useEffect, useRef } from 'react';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const Menu = ({ items, position, onClose }: MenuProps): React.ReactElement => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 调整位置以确保菜单不会超出视口
  const adjustPosition = () => {
    if (!menuRef.current) return position;

    const { width, height } = menuRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    return {
      x: Math.min(position.x, innerWidth - width - 10),
      y: Math.min(position.y, innerHeight - height - 10),
    };
  };

  const adjustedPosition = adjustPosition();

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className={styles.divider} />;
        }

        const menuItemClassName = `${styles.menuItem} ${item.danger ? styles.danger : ''} ${
          item.disabled ? styles.disabled : ''
        }`.trim();

        return (
          <div
            key={index}
            className={menuItemClassName}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose();
              }
            }}
          >
            {item.icon}
            {item.label}
          </div>
        );
      })}
    </div>
  );
};

export default Menu;
