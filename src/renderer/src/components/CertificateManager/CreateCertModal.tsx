import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Button, Space, App, Steps, Switch } from 'antd';
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
  usage: string;
  keyUsage?: string[];
  extKeyUsage?: string[];
  san?: string;
  basicConstraintsCA?: boolean;
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
  const [currentStep, setCurrentStep] = useState(0);

  // 用途与高级配置推荐映射
  const usagePresets = {
    CA: {
      keyUsage: ['keyCertSign', 'cRLSign'],
      extKeyUsage: [],
      basicConstraintsCA: true,
    },
    server: {
      keyUsage: ['digitalSignature', 'keyEncipherment'],
      extKeyUsage: ['serverAuth'],
      basicConstraintsCA: false,
    },
    client: {
      keyUsage: ['digitalSignature'],
      extKeyUsage: ['clientAuth'],
      basicConstraintsCA: false,
    },
    code: {
      keyUsage: ['digitalSignature'],
      extKeyUsage: ['codeSigning'],
      basicConstraintsCA: false,
    },
    other: {
      keyUsage: [],
      extKeyUsage: [],
      basicConstraintsCA: false,
    },
  };

  // 追踪用户是否手动编辑过高级配置
  const [advancedTouched, setAdvancedTouched] = useState(false);

  // 监听高级配置表单项的手动编辑
  const handleAdvancedChange = () => {
    setAdvancedTouched(true);
  };

  // 智能预填高级配置：切到高级配置步骤时自动填充
  useEffect(() => {
    if (currentStep === 2 && !advancedTouched) {
      const usage = form.getFieldValue('usage') || 'CA';
      const preset = usagePresets[usage as keyof typeof usagePresets];
      form.setFieldsValue({
        keyUsage: preset.keyUsage,
        extKeyUsage: preset.extKeyUsage,
        basicConstraintsCA: preset.basicConstraintsCA,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const steps = [
    {
      title: '基础信息',
      content: (
        <>
          <Form.Item
            name="usage"
            label="证书用途"
            initialValue="CA"
            rules={[{ required: true, message: '请选择证书用途' }]}
          >
            <Select>
              <Option value="CA">CA证书</Option>
              <Option value="server">服务器证书</Option>
              <Option value="client">客户端证书</Option>
              <Option value="code">代码签名证书</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="keyType"
            label="密钥类型"
            rules={[{ required: true, message: '请选择密钥类型' }]}
          >
            <Select
              onChange={value => {
                setKeyType(value);
                if (value === 'ECC') {
                  form.setFieldsValue({ keyLen: 256 });
                } else {
                  form.setFieldsValue({ keyLen: 2048 });
                }
              }}
            >
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
        </>
      ),
    },
    {
      title: '主题信息',
      content: (
        <>
          <Form.Item
            name="commonName"
            label="通用名"
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
            label="国家"
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
            label="省份"
            rules={[{ max: 128, message: '省份名称长度不能超过128个字符' }]}
          >
            <Input placeholder="如 Zhejiang" />
          </Form.Item>
          <Form.Item
            name="city"
            label="城市"
            rules={[{ max: 128, message: '城市名称长度不能超过128个字符' }]}
          >
            <Input placeholder="如 Hangzhou" />
          </Form.Item>
          <Form.Item
            name="org"
            label="组织"
            rules={[{ max: 64, message: '组织名称长度不能超过64个字符' }]}
          >
            <Input placeholder="如 Example Corp" />
          </Form.Item>
          <Form.Item
            name="ou"
            label="部门"
            rules={[{ max: 64, message: '部门名称长度不能超过64个字符' }]}
          >
            <Input placeholder="如 IT" />
          </Form.Item>
        </>
      ),
    },
    {
      title: '高级配置',
      content: (
        <>
          <Form.Item name="keyUsage" label="Key Usage">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择Key Usage"
              onChange={handleAdvancedChange}
            >
              <Option value="digitalSignature">digitalSignature</Option>
              <Option value="keyEncipherment">keyEncipherment</Option>
              <Option value="keyCertSign">keyCertSign</Option>
              <Option value="cRLSign">cRLSign</Option>
            </Select>
          </Form.Item>
          <Form.Item name="extKeyUsage" label="Extended Key Usage">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择Extended Key Usage"
              onChange={handleAdvancedChange}
            >
              <Option value="serverAuth">serverAuth</Option>
              <Option value="clientAuth">clientAuth</Option>
              <Option value="codeSigning">codeSigning</Option>
            </Select>
          </Form.Item>
          <Form.Item name="san" label="Subject Alternative Name (SAN)">
            <Input placeholder="如 example.com, www.example.com" onChange={handleAdvancedChange} />
          </Form.Item>
          <Form.Item name="basicConstraintsCA" label="是否为CA证书" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" onChange={handleAdvancedChange} />
          </Form.Item>
        </>
      ),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (_) {
      // 校验失败不跳转
    }
  };
  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      const values = form.getFieldsValue();
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
    setCurrentStep(0);
    onClose();
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
      footer={null}
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
          usage: 'CA',
        }}
        style={{ paddingRight: '8px' }}
      >
        <Steps current={currentStep} style={{ marginBottom: 12, marginTop: 12 }} size="small">
          {steps.map(item => (
            <Steps.Step key={item.title} title={item.title} />
          ))}
        </Steps>
        <div style={{ marginBottom: 0, maxHeight: '54vh', overflowY: 'auto' }}>
          {steps[currentStep].content}
        </div>
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          {currentStep > 0 && (
            <Button style={{ marginRight: 8 }} onClick={prev} disabled={loading}>
              上一步
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={next} disabled={loading}>
              下一步
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              创建
            </Button>
          )}
          <Button style={{ marginLeft: 8 }} onClick={handleClose} disabled={loading}>
            取消
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
