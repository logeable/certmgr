import { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export default function Modal({ open, title, actions, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.modalMask}>
      <div className={styles.modal}>
        {title && <div className={styles.modalTitle}>{title}</div>}
        <div className={styles.modalContent}>{children}</div>
        {actions && <div className={styles.modalActions}>{actions}</div>}
      </div>
    </div>
  );
}
