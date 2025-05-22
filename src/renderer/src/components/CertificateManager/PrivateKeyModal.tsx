import Modal from '../Modal/Modal';
import styles from './CreateRootCertModal.module.css';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
}

export default function PrivateKeyModal({ open, cert, onClose }: Props) {
  if (!cert) return null;
  return (
    <Modal
      open={open}
      title="查看私钥"
      actions={
        <button className="btn secondary" onClick={onClose}>
          关闭
        </button>
      }
    >
      <div className={styles.formScroll}>
        <div style={{ color: '#1890ff', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          私钥类型：RSA
        </div>
        <div style={{ color: '#ff4d4f', fontSize: 14, marginBottom: 10 }}>
          安全提示：请妥善保管私钥，切勿泄露给无关人员！
        </div>
        <textarea
          readOnly
          style={{ height: 140, width: '100%', fontFamily: 'monospace', fontSize: 14 }}
          value={cert.keyPem || ''}
        />
      </div>
    </Modal>
  );
}
