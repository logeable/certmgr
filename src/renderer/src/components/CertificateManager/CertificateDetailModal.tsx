import { Modal, Descriptions, Tag, Space, Typography } from 'antd';
import { SafetyCertificateOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Certificate } from '../../api';

const { Title } = Typography;

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
  if (!cert) return null;

  const subject = parseSubject(cert.subject);

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
      width={700}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Subject 信息
        </Title>

        <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="通用名 (CN)">
            <Tag color="blue">{subject.CN || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="国家 (C)">{subject.C || '-'}</Descriptions.Item>
          <Descriptions.Item label="省份 (ST)">{subject.ST || '-'}</Descriptions.Item>
          <Descriptions.Item label="城市 (L)">{subject.L || '-'}</Descriptions.Item>
          <Descriptions.Item label="组织 (O)">{subject.O || '-'}</Descriptions.Item>
          <Descriptions.Item label="部门 (OU)">{subject.OU || '-'}</Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginBottom: 16 }}>
          <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          证书信息
        </Title>

        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="证书ID">
            <Tag color="geekblue">{cert.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="签发者ID">
            <Tag color={cert.issuerId === 0 ? 'gold' : 'default'}>
              {cert.issuerId === 0 ? '根证书' : cert.issuerId}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {cert.desc || <span style={{ color: '#999' }}>暂无备注</span>}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(cert.createdAt * 1000).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(cert.updatedAt * 1000).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  );
}
