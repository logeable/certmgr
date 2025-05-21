import { CertNode } from './CertNode';
import styles from './CertTree.module.css';

export interface Cert {
  Certificate: Certificate;
  children?: Cert[];
}

export interface CertTreeProps {
  certificates: Certificate[];
  onIssue?: (certId: number) => void;
  onDelete?: (certId: number) => void;
  onViewDetails?: (certId: number) => void;
  onViewPrivateKey?: (certId: number) => void;
  onRenew?: (certId: number) => void;
}

export const CertTree = ({
  certificates,
  onIssue,
  onDelete,
  onViewDetails,
  onViewPrivateKey,
  onRenew,
}: CertTreeProps): React.ReactElement => {
  const renderCertNode = (cert: Cert) => {
    return (
      <CertNode
        key={cert.Certificate.id}
        subject={cert.Certificate.subject}
        onIssue={() => onIssue?.(cert.Certificate.id)}
        onDelete={() => onDelete?.(cert.Certificate.id)}
        onViewDetails={() => onViewDetails?.(cert.Certificate.id)}
        onViewPrivateKey={() => onViewPrivateKey?.(cert.Certificate.id)}
        onRenew={() => onRenew?.(cert.Certificate.id)}
      >
        {cert.children?.map(renderCertNode)}
      </CertNode>
    );
  };

  return (
    <div className={styles.certTree}>
      <div className={styles.treeRoot}>
        {certificates.length > 0 ? (
          renderCertNode(convertCert(certificates))
        ) : (
          <div className={styles.emptyState}>当前空间下无证书</div>
        )}
      </div>
    </div>
  );
};

function convertCert(certs: Certificate[]): Cert {
  const certMap = new Map<number, Cert>();

  // 将所有证书转换为 Cert 并存入 Map
  certs.forEach(cert => {
    certMap.set(cert.id, { Certificate: cert, children: [] });
  });

  let root: Cert | null = null;

  // 组织树形结构
  certs.forEach(cert => {
    const currentCert = certMap.get(cert.id)!;
    if (cert.issuerId === 0 || !certMap.has(cert.issuerId)) {
      // 如果 issuerId 为 0 或找不到父级，认为是根节点
      root = currentCert;
    } else {
      const parent = certMap.get(cert.issuerId)!;
      parent.children!.push(currentCert);
    }
  });

  // 返回根节点
  if (!root) {
    throw new Error('No root certificate found.');
  }

  return root;
}

export default CertTree;
