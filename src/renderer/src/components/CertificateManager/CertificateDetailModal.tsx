import Modal from '../Modal/Modal';
import styles from './CreateRootCertModal.module.css';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
}

// 解析 subject 字符串为对象
function parseSubject(subject: string) {
  // 例：C=CN, ST=Jiangsu, L=Nanjing, O=Example Corp, OU=IT, CN=example.com
  const result: Record<string, string> = {};
  subject.split(',').forEach(pair => {
    const [k, ...rest] = pair.trim().split('=');
    if (k && rest.length > 0) {
      result[k] = rest.join('=');
    }
  });
  return result;
}

const FIELD_LABELS: [string, string][] = [
  ['C', '国家(C)'],
  ['ST', '省份(ST)'],
  ['L', '城市(L)'],
  ['O', '组织(O)'],
  ['OU', '部门(OU)'],
  ['CN', '通用名(CN)'],
];

export default function CertificateDetailModal({ open, cert, onClose }: Props) {
  if (!cert) return null;
  const subject = parseSubject(cert.subject);
  return (
    <Modal
      open={open}
      title="证书详情"
      actions={
        <button className="btn secondary" onClick={onClose}>
          关闭
        </button>
      }
    >
      <div className={styles.formScroll}>
        <div style={{ fontWeight: 600, color: '#1890ff', marginBottom: 8 }}>Subject 信息</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            {FIELD_LABELS.map(([key, label]) => (
              <tr key={key}>
                <td
                  style={{
                    width: 120,
                    color: '#555',
                    fontWeight: 500,
                    padding: '6px 8px',
                    background: '#fafbfc',
                  }}
                >
                  {label}
                </td>
                <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>
                  {subject[key] || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.formSectionTitle}>其他信息</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: 120,
                  color: '#555',
                  fontWeight: 500,
                  padding: '6px 8px',
                  background: '#fafbfc',
                }}
              >
                备注
              </td>
              <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>
                {cert.desc || '-'}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  width: 120,
                  color: '#555',
                  fontWeight: 500,
                  padding: '6px 8px',
                  background: '#fafbfc',
                }}
              >
                证书ID
              </td>
              <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>{cert.id}</td>
            </tr>
            <tr>
              <td
                style={{
                  width: 120,
                  color: '#555',
                  fontWeight: 500,
                  padding: '6px 8px',
                  background: '#fafbfc',
                }}
              >
                签发者ID
              </td>
              <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>
                {cert.issuerId}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  width: 120,
                  color: '#555',
                  fontWeight: 500,
                  padding: '6px 8px',
                  background: '#fafbfc',
                }}
              >
                创建时间
              </td>
              <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>
                {new Date(cert.createdAt * 1000).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  width: 120,
                  color: '#555',
                  fontWeight: 500,
                  padding: '6px 8px',
                  background: '#fafbfc',
                }}
              >
                更新时间
              </td>
              <td style={{ color: '#222', padding: '6px 8px', background: '#fff' }}>
                {new Date(cert.updatedAt * 1000).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
