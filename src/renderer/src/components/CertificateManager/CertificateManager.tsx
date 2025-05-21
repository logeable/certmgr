import { useEffect, useState } from 'react';
import styles from './CertificateManager.module.css';
import CreateRootCertModal from './CreateRootCertModal';

interface Namespace {
  id: string;
  name: string;
}

export default function CertificateManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNs, setSelectedNs] = useState('');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [showCreateRoot, setShowCreateRoot] = useState(false);

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
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>证书名称</th>
          </tr>
        </thead>
        <tbody>
          {certs.map(cert => (
            <tr key={cert.id}>
              <td>
                {cert.id}-{cert.subject}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CreateRootCertModal
        open={showCreateRoot}
        namespaceId={selectedNs}
        issuerId={0}
        onClose={() => setShowCreateRoot(false)}
        onSuccess={() => {
          setShowCreateRoot(false);
          if (selectedNs)
            window.api.certificates.list(selectedNs).then((list: Certificate[]) => setCerts(list));
        }}
      />
    </div>
  );
}
