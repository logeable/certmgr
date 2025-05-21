import { ReactNode } from 'react';
import styles from './Main.module.css';

export default function Main({ children }: { children: ReactNode }) {
  return <div className={styles.main}>{children}</div>;
}
