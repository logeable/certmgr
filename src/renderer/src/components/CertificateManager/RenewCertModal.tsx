import { useState } from 'react';
import { Modal, Form, InputNumber, Button, Space, Alert, App } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api, { Certificate } from '../../api';

interface Props {
  open: boolean;
  cert: Certificate | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  validDays: number;
}

export default function RenewCertModal({ open, cert, onClose, onSuccess }: Props) {
  const [form] = Form.useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  if (!cert) return null;

  const handleRenew = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await api.certificates.renew(cert.id, values.validDays);
      message.success('证书续期成功');
      onSuccess();
      handleClose();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      message.error('证书续期失败');
      console.error('Failed to renew certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <ReloadOutlined />
          续期证书
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleRenew}>
          续期
        </Button>,
      ]}
      width={500}
      destroyOnHidden
    >
      <Alert
        message="证书续期"
        description={`即将为证书 "${cert.subject}" 进行续期操作，请设置新的有效期。`}
        type="info"
        showIcon
        icon={<ClockCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          validDays: 365,
        }}
      >
        <Form.Item
          name="validDays"
          label="有效期（天）"
          rules={[
            { required: true, message: '请输入有效期' },
            { type: 'number', min: 1, message: '有效期必须大于0天' },
            { type: 'number', max: 36500, message: '有效期不能超过100年' },
          ]}
          extra="建议设置为365天（1年）或更短的时间"
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入有效期天数"
            min={1}
            max={36500}
            addonAfter="天"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
