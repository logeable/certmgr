import { useState } from 'react';
import Modal from '../Modal/Modal';
import styles from './CreateCertModal.module.css';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewCertModal({ open, cert, onClose, onSuccess }: Props) {
  const [validDays, setValidDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!cert) return null;

  const handleRenew = async () => {
    if (!validDays) {
      setError('请输入有效期');
      return;
    }
    setLoading(true);
    setError('');
    await window.api.certificates.renew(cert.id, validDays);
    setLoading(false);
    onSuccess();
    handleClose();
  };

  const handleClose = () => {
    setValidDays(365);
    setError('');
    onClose();
  };

  return (
    <Modal
      open={open}
      title="续签证书"
      actions={
        <>
          <button className="btn secondary" onClick={handleClose} disabled={loading}>
            取消
          </button>
          <button className="btn" onClick={handleRenew} disabled={loading || !validDays}>
            {loading ? '续签中...' : '续签'}
          </button>
        </>
      }
    >
      <div className={styles.formScroll}>
        <label className={styles.formLabel}>
          有效期（天）<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.formInput}
          type="number"
          value={validDays}
          onChange={e => setValidDays(Number(e.target.value))}
          placeholder="如 365，必填"
          required
        />
        {error && <div className={styles.formError}>{error}</div>}
      </div>
    </Modal>
  );
}
