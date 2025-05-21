import { useEffect, useState } from 'react';
import styles from './CertificateManager.module.css';
import CreateRootCertModal from './CreateRootCertModal';
import CertTree from '../CertTree';
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

  const handleIssue = (issuerId: number) => {
    setIssuerId(issuerId);
    setShowCreateRoot(true);
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
      <CertTree certificates={certs} onIssue={handleIssue} />
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
    </div>
  );
}
