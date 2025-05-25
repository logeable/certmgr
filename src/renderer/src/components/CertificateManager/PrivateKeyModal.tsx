import { Modal, Alert, Typography, Space, Button, Input, App } from 'antd';
import { KeyOutlined, CopyOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Certificate } from '../../api';

const { Title } = Typography;
const { TextArea } = Input;

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
}

export default function PrivateKeyModal({ open, cert, onClose }: Props) {
  const { message } = App.useApp();

  if (!cert) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success(`${type}已复制到剪贴板`);
      })
      .catch(() => {
        message.error(`复制${type}失败`);
      });
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          查看证书和私钥
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <Alert
          message="安全提示"
          description="请妥善保管私钥，切勿泄露给无关人员！私钥一旦泄露可能导致严重的安全风险。"
          type="warning"
          showIcon
          icon={<EyeInvisibleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Title level={5} style={{ marginBottom: 12, color: '#1890ff' }}>
          证书 PEM
        </Title>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <TextArea
            value={cert.certPem || ''}
            readOnly
            rows={8}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '12px',
              lineHeight: '1.4',
            }}
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255, 255, 255, 0.8)',
            }}
            onClick={() => copyToClipboard(cert.certPem || '', '证书')}
          >
            复制
          </Button>
        </div>

        <Title level={5} style={{ marginBottom: 12, color: '#ff4d4f' }}>
          私钥 PEM
        </Title>
        <div style={{ position: 'relative' }}>
          <TextArea
            value={cert.keyPem || ''}
            readOnly
            rows={8}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '12px',
              lineHeight: '1.4',
              border: '1px solid #ff4d4f',
            }}
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            danger
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255, 255, 255, 0.8)',
            }}
            onClick={() => copyToClipboard(cert.keyPem || '', '私钥')}
          >
            复制
          </Button>
        </div>
      </div>
    </Modal>
  );
}
