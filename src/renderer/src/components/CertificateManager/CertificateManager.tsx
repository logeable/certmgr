import { useEffect, useState } from 'react';
import styles from './CertificateManager.module.css';
import CreateRootCertModal from './CreateRootCertModal';
import CertTree from '../CertTree';
import Modal from '../Modal/Modal';
interface Namespace {
  id: string;
  name: string;
}

export default function CertificateManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNs, setSelectedNs] = useState('');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [showCreateRoot, setShowCreateRoot] = useState(false);
  const [issuerId, setIssuerId] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [certToDelete, setCertToDelete] = useState<number | null>(null);

  useEffect(() => {
    window.api.namespaces.list().then((list: Namespace[]) => {
      setNamespaces(list);
      if (list.length > 0) setSelectedNs(list[0].id.toString());
    });
  }, []);

  useEffect(() => {
    if (selectedNs) {
      window.api.certificates.list(selectedNs).then((list: Certificate[]) => {
        setCerts(list);
        // 检查是否有根证书
        const hasRoot = list.some(cert => cert.issuerId === 0);
        if (!hasRoot) setShowCreateRoot(true);
      });
    }
  }, [selectedNs]);

  const onIssue = (issuerId: number) => {
    setIssuerId(issuerId);
    setShowCreateRoot(true);
  };

  const onDelete = (certId: number) => {
    setShowDelete(true);
    setCertToDelete(certId);
  };

  const handleDelete = async () => {
    if (certToDelete) {
      await window.api.certificates.delete(certToDelete);
      setShowDelete(false);
      setCertToDelete(null);
      if (selectedNs)
        window.api.certificates.list(selectedNs).then((list: Certificate[]) => setCerts(list));
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>证书管理</h2>
      <div style={{ marginBottom: 16 }}>
        <label>空间选择：</label>
        <select value={selectedNs} onChange={e => setSelectedNs(e.target.value)}>
          {namespaces.map(ns => (
            <option key={ns.id} value={ns.id}>
              {ns.name}
            </option>
          ))}
        </select>
      </div>
      <CertTree certificates={certs} onIssue={onIssue} onDelete={onDelete} />
      <CreateRootCertModal
        open={showCreateRoot}
        namespaceId={selectedNs}
        issuerId={issuerId}
        onClose={() => {
          setShowCreateRoot(false);
          setIssuerId(0);
        }}
        onSuccess={() => {
          if (selectedNs)
            window.api.certificates.list(selectedNs).then((list: Certificate[]) => setCerts(list));
        }}
      />
      <Modal
        open={showDelete}
        title="确认删除空间"
        actions={
          <>
            <button className={styles.btn + ' ' + styles.danger} onClick={handleDelete}>
              删除
            </button>
            <button
              className={styles.btn + ' ' + styles.secondary}
              onClick={() => setShowDelete(false)}
            >
              取消
            </button>
          </>
        }
      >
        <div>确定要删除该证书及所有子证书吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}
