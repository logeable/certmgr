import Modal from '../Modal/Modal';
import styles from './CreateCertModal.module.css';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
}

export default function PemModal({ open, cert, onClose }: Props) {
  if (!cert) return null;
  return (
    <Modal
      open={open}
      title="查看PEM"
      actions={
        <button className="btn secondary" onClick={onClose}>
          关闭
        </button>
      }
    >
      <div className={styles.formScroll}>
        <div style={{ color: '#1890ff', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          证书PEM
        </div>
        <textarea
          readOnly
          style={{
            height: 120,
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 14,
            marginBottom: 16,
          }}
          value={cert.certPem || ''}
        />
        <div style={{ color: '#ff4d4f', fontSize: 14, marginBottom: 10 }}>
          安全提示：请妥善保管私钥，切勿泄露给无关人员！
        </div>
        <div style={{ color: '#1890ff', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
          私钥PEM
        </div>
        <textarea
          readOnly
          style={{ height: 120, width: '100%', fontFamily: 'monospace', fontSize: 14 }}
          value={cert.keyPem || ''}
        />
      </div>
    </Modal>
  );
}
