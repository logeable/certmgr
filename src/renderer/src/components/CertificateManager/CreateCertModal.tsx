import { useState } from 'react';
import Modal from '../Modal/Modal';
import styles from './CreateCertModal.module.css';

interface Props {
  open: boolean;
  namespaceId: string;
  issuerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCertModal({
  open,
  namespaceId,
  issuerId,
  onClose,
  onSuccess,
}: Props) {
  const [keyType, setKeyType] = useState('RSA');
  const [keyLen, setKeyLen] = useState(2048);
  const [validDays, setValidDays] = useState(365);
  const [desc, setDesc] = useState('');
  // Subject
  const [country, setCountry] = useState('CN');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [org, setOrg] = useState('');
  const [ou, setOu] = useState('');
  const [commonName, setCommonName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!commonName.trim() || !country.trim() || !keyLen || !validDays) {
      setError('请填写所有必填项');
      return;
    }
    setLoading(true);
    setError('');

    await window.api.certificates.create({
      namespaceId,
      issuerId,
      keyType,
      keyLen,
      validDays,
      desc,
      subject: {
        country,
        state,
        city,
        org,
        ou,
        commonName,
      },
    });
    setLoading(false);
    onSuccess();
    handleClose();
  };

  const clearForm = () => {
    setKeyType('RSA');
    setKeyLen(2048);
    setValidDays(365);
    setDesc('');
    setCountry('CN');
    setState('');
    setCity('');
    setOrg('');
    setOu('');
    setCommonName('');
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="创建证书"
      actions={
        <>
          <button className="btn secondary" onClick={handleClose} disabled={loading}>
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
        {keyType === 'RSA' ? (
          <select
            className={styles.formSelect}
            value={keyLen}
            onChange={e => setKeyLen(Number(e.target.value))}
            required
          >
            <option value={2048}>2048</option>
            <option value={3072}>3072</option>
            <option value={4096}>4096</option>
            <option value={8192}>8192</option>
          </select>
        ) : (
          <input
            className={styles.formInput}
            type="number"
            value={keyLen}
            onChange={e => setKeyLen(Number(e.target.value))}
            placeholder="如 2048，必填"
            required
            disabled
          />
        )}
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
        <label className={styles.formLabel}>备注</label>
        <textarea
          className={styles.formTextarea}
          value={desc}
          onChange={e => setDesc(e.target.value)}
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
        {error && <div className={styles.formError}>{error}</div>}
      </div>
    </Modal>
  );
}
