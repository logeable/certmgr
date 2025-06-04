import { useEffect, useState } from 'react';
import { Modal, Descriptions, Tag, Space, Typography, Collapse, Button, Spin, App } from 'antd';
import {
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import api, { Certificate, CertificateDetail } from '../../api';

const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

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

export default function CertificateDetailModal({ open, cert, onClose }: Props) {
  const [detail, setDetail] = useState<CertificateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    if (open && cert) {
      setLoading(true);
      api.certificates
        .get(cert.id)
        .then(data => setDetail(data || null))
        .catch(() => {
          message.error('获取证书详情失败');
          setDetail(null);
        })
        .finally(() => setLoading(false));
    } else {
      setDetail(null);
    }
  }, [open, cert, message]);

  const subject = parseSubject(detail?.subject || '');

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined />
          证书详情
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading ? (
          <Spin style={{ width: '100%', margin: '48px 0' }} />
        ) : !detail ? null : (
          <>
            {/* 主题信息 */}
            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
              <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              主题信息
            </Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="通用名 (CN)">
                <Tag color="blue">{subject.CN || '-'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="国家 (C)">{subject.C || '-'}</Descriptions.Item>
              <Descriptions.Item label="省份 (ST)">{subject.ST || '-'}</Descriptions.Item>
              <Descriptions.Item label="城市 (L)">{subject.L || '-'}</Descriptions.Item>
              <Descriptions.Item label="组织 (O)">{subject.O || '-'}</Descriptions.Item>
              <Descriptions.Item label="部门 (OU)">{subject.OU || '-'}</Descriptions.Item>
            </Descriptions>

            {/* 证书信息 */}
            <Title level={5} style={{ marginBottom: 16 }}>
              <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              证书信息
            </Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="证书ID">
                <Tag color="geekblue">{detail.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="签发者ID">
                <Tag color={detail.issuerId === 0 ? 'gold' : 'default'}>
                  {detail.issuerId === 0 ? '根证书' : detail.issuerId}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="签发者 Subject">
                {detail.issuerSubject ? (
                  detail.issuerSubject
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="备注">
                {detail.desc || <span style={{ color: '#999' }}>暂无备注</span>}
              </Descriptions.Item>
              <Descriptions.Item label="有效期起始">
                {detail.notBefore ? new Date(detail.notBefore * 1000).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="有效期截止">
                {detail.notAfter ? new Date(detail.notAfter * 1000).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detail.createdAt * 1000).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(detail.updatedAt * 1000).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="密钥类型">{detail.keyType || '-'}</Descriptions.Item>
              <Descriptions.Item label="密钥长度/曲线">
                {detail.keyType === 'RSA' ? detail.keyLen : detail.eccCurve || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="有效期（天）">{detail.validDays || '-'}</Descriptions.Item>
              <Descriptions.Item label="用途">
                {detail.usage ? <Tag color="blue">{detail.usage}</Tag> : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 高级配置 */}
            <Title level={5} style={{ marginBottom: 16 }}>
              <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              高级配置
            </Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Key Usage">
                {detail.keyUsage && detail.keyUsage.length > 0 ? (
                  detail.keyUsage.map(u => <Tag key={u}>{u}</Tag>)
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Extended Key Usage">
                {detail.extKeyUsage && detail.extKeyUsage.length > 0 ? (
                  detail.extKeyUsage.map(u => <Tag key={u}>{u}</Tag>)
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="DNS Names">
                {detail.dnsNames && detail.dnsNames.length > 0 ? (
                  detail.dnsNames.join(', ')
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="IP Addresses">
                {detail.ipAddresses && detail.ipAddresses.length > 0 ? (
                  detail.ipAddresses.join(', ')
                ) : (
                  <span style={{ color: '#999' }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="是否为CA证书">
                {detail.isCA ? <Tag color="green">是</Tag> : <Tag>否</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {/* 证书原文 */}
            <Collapse style={{ marginBottom: 16 }}>
              <Panel
                header={
                  <span>
                    <EyeOutlined style={{ marginRight: 8 }} />
                    证书原文（PEM）
                  </span>
                }
                key="certPem"
              >
                <Paragraph style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: 13 }}>
                  {detail.certPem}
                </Paragraph>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={async () => {
                    if (detail.certPem) {
                      await navigator.clipboard.writeText(detail.certPem);
                      message.success('证书内容已复制');
                    }
                  }}
                  style={{ float: 'right' }}
                >
                  复制证书内容
                </Button>
              </Panel>
            </Collapse>
            {/* 密钥原文 */}
            {detail.keyPem && (
              <Collapse style={{ marginBottom: 16 }}>
                <Panel
                  header={
                    <span>
                      <EyeOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                      密钥原文（PEM）
                    </span>
                  }
                  key="keyPem"
                >
                  <Paragraph
                    style={{
                      whiteSpace: 'pre',
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: '#ff4d4f',
                    }}
                  >
                    {detail.keyPem}
                  </Paragraph>
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    danger
                    onClick={async () => {
                      if (detail.keyPem) {
                        await navigator.clipboard.writeText(detail.keyPem);
                        message.success('密钥内容已复制');
                      }
                    }}
                    style={{ float: 'right' }}
                  >
                    复制密钥内容
                  </Button>
                </Panel>
              </Collapse>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
