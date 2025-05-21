import { useState } from 'react';
import Modal from '../Modal/Modal';
import styles from './CreateRootCertModal.module.css';

interface Props {
  open: boolean;
  namespaceId: string;
  issuerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRootCertModal({
  open,
  namespaceId,
  issuerId,
  onClose,
  onSuccess,
}: Props) {
  const [keyType, setKeyType] = useState('RSA');
  const [keyLen, setKeyLen] = useState(2048);
  const [validDays, setValidDays] = useState(3650);
  const [remark, setRemark] = useState('');
  // Subject
  const [country, setCountry] = useState('CN');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [org, setOrg] = useState('');
  const [ou, setOu] = useState('');
  const [commonName, setCommonName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!commonName.trim() || !country.trim() || !keyLen || !validDays) {
      setError('请填写所有必填项');
      return;
    }
    setLoading(true);
    setError('');
    await window.api.certificates.createRoot({
      namespaceId,
      issuerId,
      keyType,
      keyLen,
      validDays,
      remark,
      subject: {
        country,
        state,
        city,
        org,
        ou,
        commonName,
        email,
      },
    });
    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="创建根证书"
      actions={
        <>
          <button className="btn secondary" onClick={onClose} disabled={loading}>
            取消
          </button>
          <button
            className="btn"
            onClick={handleSubmit}
            disabled={loading || !commonName.trim() || !country.trim() || !keyLen || !validDays}
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </>
      }
    >
      <div className={styles.formScroll}>
        <label className={styles.formLabel}>
          密钥类型<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <select
          className={styles.formSelect}
          value={keyType}
          onChange={e => setKeyType(e.target.value)}
          required
        >
          <option value="RSA">RSA</option>
          <option value="ECC">ECC</option>
        </select>
        <label className={styles.formLabel}>
          密钥长度<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.formInput}
          type="number"
          value={keyLen}
          onChange={e => setKeyLen(Number(e.target.value))}
          placeholder="如 2048，必填"
          required
        />
        <label className={styles.formLabel}>
          有效期（天）<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.formInput}
          type="number"
          value={validDays}
          onChange={e => setValidDays(Number(e.target.value))}
          placeholder="如 3650，必填"
          required
        />
        <label className={styles.formLabel}>备注</label>
        <textarea
          className={styles.formTextarea}
          value={remark}
          onChange={e => setRemark(e.target.value)}
          placeholder="可选，便于管理和识别"
        />
        <div className={styles.formSectionTitle}>Subject 信息</div>
        <label className={styles.formLabel}>
          通用名 (Common Name, 如服务器FQDN或姓名)<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.formInput}
          type="text"
          value={commonName}
          onChange={e => setCommonName(e.target.value)}
          placeholder="如 example.com，必填"
          required
        />
        <label className={styles.formLabel}>
          国家 (Country Name, 2字母代码)<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.formInput}
          type="text"
          value={country}
          onChange={e => setCountry(e.target.value)}
          placeholder="如 CN，必填"
          maxLength={2}
          required
        />
        <label className={styles.formLabel}>省份 (State or Province Name)</label>
        <input
          className={styles.formInput}
          type="text"
          value={state}
          onChange={e => setState(e.target.value)}
          placeholder="如 Jiangsu"
        />
        <label className={styles.formLabel}>城市 (Locality Name)</label>
        <input
          className={styles.formInput}
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="如 Nanjing"
        />
        <label className={styles.formLabel}>组织 (Organization Name)</label>
        <input
          className={styles.formInput}
          type="text"
          value={org}
          onChange={e => setOrg(e.target.value)}
          placeholder="如 Example Corp"
        />
        <label className={styles.formLabel}>部门 (Organizational Unit Name)</label>
        <input
          className={styles.formInput}
          type="text"
          value={ou}
          onChange={e => setOu(e.target.value)}
          placeholder="如 IT"
        />
        <label className={styles.formLabel}>邮箱 (Email Address)</label>
        <input
          className={styles.formInput}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="如 admin@example.com"
        />
        {error && <div className={styles.formError}>{error}</div>}
      </div>
    </Modal>
  );
}
