import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Space, Typography, Popconfirm, Tag, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api, { Namespace } from '../../api';
import FilterDropdown from './FilterDropdown';

const { Title } = Typography;
const { TextArea } = Input;

interface NamespaceFormData {
  name: string;
  desc: string;
}

export default function NamespaceManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [modalConfirmLoading, setModalConfirmLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNamespace, setEditingNamespace] = useState<Namespace | null>(null);
  const [form] = Form.useForm<NamespaceFormData>();
  const { message } = App.useApp();

  // 拉取空间列表
  const fetchNamespaces = async () => {
    setTableLoading(true);
    try {
      const list = await api.namespaces.list();
      setNamespaces(list);
    } catch (error) {
      message.error('获取空间列表失败');
      console.error('Failed to fetch namespaces:', error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchNamespaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 打开新建/编辑模态框
  const handleOpenModal = (namespace?: Namespace) => {
    setEditingNamespace(namespace || null);
    if (namespace) {
      form.setFieldsValue({
        name: namespace.name,
        desc: namespace.desc,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingNamespace(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    setModalConfirmLoading(true);
    try {
      const values = await form.validateFields();

      if (editingNamespace) {
        // 编辑
        try {
          await api.namespaces.update(editingNamespace.id, values.name, values.desc);
        } catch (error) {
          message.error('编辑空间失败');
          console.error('Failed to update namespace:', error);
          return;
        }
        message.success('空间编辑成功');
      } else {
        // 新建
        try {
          await api.namespaces.create(values.name, values.desc);
        } catch (error) {
          message.error('创建空间失败');
          console.error('Failed to create namespace:', error);
          return;
        }
        message.success('空间创建成功');
      }

      handleCloseModal();
      fetchNamespaces();
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      message.error(editingNamespace ? '编辑空间失败' : '创建空间失败');
      console.error('Failed to save namespace:', error);
    } finally {
      setModalConfirmLoading(false);
    }
  };

  // 删除空间
  const handleDelete = async (namespace: Namespace) => {
    try {
      await api.namespaces.delete(namespace.id);
      message.success('空间删除成功');
      fetchNamespaces();
    } catch (error) {
      message.error('删除空间失败');
      console.error('Failed to delete namespace:', error);
    }
  };

  // 表格列定义
  const columns: ColumnsType<Namespace> = [
    {
      title: '空间名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      filterDropdown: props => <FilterDropdown {...props} placeholder="搜索空间名称" />,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) =>
        record.name
          ? record.name
              .toString()
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
      sorter: (a, b) => a.createdAt - b.createdAt,
    },
    {
      title: '证书数量',
      dataIndex: 'certCount',
      key: 'certCount',
      render: (count: number) => <Tag color={count > 0 ? 'blue' : 'default'}>{count} 个证书</Tag>,
      sorter: (a, b) => a.certCount - b.certCount,
    },
    {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
      ellipsis: true,
      render: (desc: string) => desc || <span style={{ color: '#999' }}>暂无描述</span>,
      filterDropdown: props => <FilterDropdown {...props} placeholder="搜索描述" />,
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value, record) =>
        record.desc
          ? record.desc
              .toString()
              .toLowerCase()
              .includes((value as string).toLowerCase())
          : false,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除空间"
            description={
              <div>
                <div>确定要删除空间 &ldquo;{record.name}&rdquo; 吗？</div>
                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                  此操作将删除该空间下所有证书和私钥，且不可恢复！
                </div>
              </div>
            }
            onConfirm={() => handleDelete(record)}
            okText="确认删除"
            cancelText="取消"
            okType="danger"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            空间管理
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新建空间
          </Button>
        </div>

        <Table
          style={{ overflow: 'scroll', height: '100%' }}
          columns={columns}
          dataSource={namespaces}
          rowKey="id"
          loading={tableLoading}
          locale={{
            emptyText: '暂无空间数据',
          }}
          pagination={false}
        />
      </div>

      <Modal
        title={editingNamespace ? '编辑空间' : '新建空间'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText={editingNamespace ? '保存' : '创建'}
        cancelText="取消"
        destroyOnHidden
        confirmLoading={modalConfirmLoading}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="空间名称"
            rules={[
              { required: true, message: '请输入空间名称' },
              { min: 1, max: 50, message: '空间名称长度应在1-50个字符之间' },
            ]}
          >
            <Input placeholder="请输入空间名称" />
          </Form.Item>

          <Form.Item
            name="desc"
            label="描述"
            rules={[{ max: 200, message: '描述长度不能超过200个字符' }]}
          >
            <TextArea
              placeholder="请输入空间描述（可选）"
              rows={3}
              showCount
              maxLength={200}
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
