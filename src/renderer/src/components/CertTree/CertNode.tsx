import { useState } from 'react';
import { Menu } from '../Menu/Menu';
import styles from './CertNode.module.css';

export interface CertNodeProps {
  subject: string;
  children?: React.ReactNode;
  onIssue?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
  onViewPrivateKey?: () => void;
  onRenew?: () => void;
}

export const CertNode = ({
  subject,
  children,
  onIssue,
  onDelete,
  onViewDetails,
  onViewPrivateKey,
  onRenew,
}: CertNodeProps): React.ReactElement => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMenuClose = () => {
    setShowMenu(false);
  };

  const menuItems = [
    { label: '签发证书', onClick: onIssue },
    { label: '删除证书', onClick: onDelete },
    { label: '查看详情', onClick: onViewDetails },
    { label: '查看私钥', onClick: onViewPrivateKey },
    { label: '续签', onClick: onRenew },
  ];

  return (
    <div className={styles.treeNode}>
      <span className={styles.subject} onContextMenu={handleContextMenu}>
        {subject}
      </span>
      {children}
      {showMenu && <Menu items={menuItems} position={menuPosition} onClose={handleMenuClose} />}
    </div>
  );
};
