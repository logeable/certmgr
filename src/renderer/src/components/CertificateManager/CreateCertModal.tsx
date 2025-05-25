import { useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Space, Divider, Alert, App } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../../api';

const { TextArea } = Input;
const { Option } = Select;

interface Props {
  open: boolean;
  namespaceId: string;
  issuerId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  keyType: string;
  keyLen: number;
  validDays: number;
  desc: string;
  country: string;
  state: string;
  city: string;
  org: string;
  ou: string;
  commonName: string;
}

export default function CreateCertModal({
  open,
  namespaceId,
  issuerId,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [keyType, setKeyType] = useState('RSA');
  const { message } = App.useApp();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await api.certificates.create(
        namespaceId,
        issuerId,
        values.keyType,
        values.keyLen,
        values.validDays,
        values.desc,
        {
          country: values.country,
          state: values.state,
          city: values.city,
          org: values.org,
          ou: values.ou,
          commonName: values.commonName,
        },
      );

      message.success('证书创建成功');
      onSuccess();
      handleClose();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      message.error('创建证书失败');
      console.error('Failed to create certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setKeyType('RSA');
    onClose();
  };

  const handleKeyTypeChange = (value: string) => {
    setKeyType(value);
    // 当切换到 ECC 时，设置默认密钥长度
    if (value === 'ECC') {
      form.setFieldsValue({ keyLen: 256 });
    } else {
      form.setFieldsValue({ keyLen: 2048 });
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined />
          创建证书
        </Space>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={loading}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          创建
        </Button>,
      ]}
      width={600}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          keyType: 'RSA',
          keyLen: 2048,
          validDays: 365,
          country: 'CN',
        }}
        style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}
      >
        <Alert
          message="证书配置"
          description="请填写证书的基本配置信息，带 * 的为必填项"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="keyType"
          label="密钥类型"
          rules={[{ required: true, message: '请选择密钥类型' }]}
        >
          <Select onChange={handleKeyTypeChange}>
            <Option value="RSA">RSA</Option>
            <Option value="ECC">ECC</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="keyLen"
          label="密钥长度"
          rules={[{ required: true, message: '请输入密钥长度' }]}
        >
          {keyType === 'RSA' ? (
            <Select>
              <Option value={2048}>2048</Option>
              <Option value={3072}>3072</Option>
              <Option value={4096}>4096</Option>
              <Option value={8192}>8192</Option>
            </Select>
          ) : (
            <InputNumber style={{ width: '100%' }} placeholder="如 256" min={1} disabled />
          )}
        </Form.Item>

        <Form.Item
          name="validDays"
          label="有效期（天）"
          rules={[
            { required: true, message: '请输入有效期' },
            { type: 'number', min: 1, message: '有效期必须大于0' },
          ]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="如 365" min={1} />
        </Form.Item>

        <Form.Item
          name="desc"
          label="备注"
          rules={[{ max: 200, message: '备注长度不能超过200个字符' }]}
        >
          <TextArea placeholder="可选，便于管理和识别" rows={2} showCount maxLength={200} />
        </Form.Item>

        <Divider orientation="left">Subject 信息</Divider>

        <Form.Item
          name="commonName"
          label="通用名 (Common Name)"
          rules={[
            { required: true, message: '请输入通用名' },
            { max: 64, message: '通用名长度不能超过64个字符' },
          ]}
          extra="如服务器FQDN或姓名，例如：example.com"
        >
          <Input placeholder="如 example.com" />
        </Form.Item>

        <Form.Item
          name="country"
          label="国家 (Country Name)"
          rules={[
            { required: true, message: '请输入国家代码' },
            { len: 2, message: '国家代码必须是2个字符' },
          ]}
          extra="2字母代码，例如：CN"
        >
          <Input placeholder="如 CN" maxLength={2} />
        </Form.Item>

        <Form.Item
          name="state"
          label="省份 (State or Province Name)"
          rules={[{ max: 128, message: '省份名称长度不能超过128个字符' }]}
        >
          <Input placeholder="如 Jiangsu" />
        </Form.Item>

        <Form.Item
          name="city"
          label="城市 (Locality Name)"
          rules={[{ max: 128, message: '城市名称长度不能超过128个字符' }]}
        >
          <Input placeholder="如 Nanjing" />
        </Form.Item>

        <Form.Item
          name="org"
          label="组织 (Organization Name)"
          rules={[{ max: 64, message: '组织名称长度不能超过64个字符' }]}
        >
          <Input placeholder="如 Example Corp" />
        </Form.Item>

        <Form.Item
          name="ou"
          label="部门 (Organizational Unit Name)"
          rules={[{ max: 64, message: '部门名称长度不能超过64个字符' }]}
        >
          <Input placeholder="如 IT" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
