import { useEffect, useState } from 'react';
import {
  Select,
  Space,
  Typography,
  App,
  Card,
  Empty,
  Button,
  Tree,
  TreeDataNode,
  Dropdown,
  MenuProps,
  Tooltip,
  Tag,
  Modal as AntdModal,
} from 'antd';
import {
  DatabaseOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import CreateCertModal from './CreateCertModal';
import CertificateDetailModal from './CertificateDetailModal';
import RenewCertModal from './RenewCertModal';
import api, { Certificate, Namespace } from '../../api';

const { Title } = Typography;
const { Option } = Select;

export default function CertificateManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNs, setSelectedNs] = useState('');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [issuerId, setIssuerId] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [detailCert, setDetailCert] = useState<Certificate | null>(null);
  const [showRenew, setShowRenew] = useState(false);
  const [renewCert, setRenewCert] = useState<Certificate | null>(null);
  const [namespacesLoading, setNamespacesLoading] = useState(false);
  const [certsLoading, setCertsLoading] = useState(false);
  const { message, modal } = App.useApp();
  const [selectedCertId, setSelectedCertId] = useState<number | null>(null);
  const [showTreeHelp, setShowTreeHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchNamespaces = async () => {
      setNamespacesLoading(true);
      try {
        const list = await api.namespaces.list();
        setNamespaces(list);
      } catch (error) {
        message.error('获取空间列表失败');
        console.error('Failed to fetch namespaces:', error);
      } finally {
        setNamespacesLoading(false);
      }
    };

    fetchNamespaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (selectedNs) {
        setCertsLoading(true);
        try {
          const list = await api.certificates.list(selectedNs);
          setCerts(list);
        } catch (error) {
          message.error('获取证书列表失败');
          console.error('Failed to fetch certificates:', error);
        } finally {
          setCertsLoading(false);
        }
      }
    };

    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNs]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在没有任何模态框弹出时才响应快捷键
      if (showDetail || showCreate || showRenew || showTreeHelp || showDeleteConfirm) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCertId) {
        onDelete(selectedCertId);
      } else if (e.key === 's' && selectedCertId) {
        const cert = certs.find(c => c.id === selectedCertId);
        if (cert && cert.isCA) {
          onIssue(selectedCertId);
        }
      } else if ((e.key === 'Enter' || e.key === ' ') && selectedCertId) {
        onViewDetails(selectedCertId);
      } else if (e.key === 'r' && selectedCertId) {
        onRenew(selectedCertId);
      } else if (e.key === 'e' && selectedCertId) {
        onExport(selectedCertId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCertId, showDetail, showCreate, showRenew, showTreeHelp, certs, showDeleteConfirm]);

  const onIssue = (issuerId: number) => {
    setIssuerId(issuerId);
    setShowCreate(true);
  };

  const onViewDetails = (certId: number) => {
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      setDetailCert(cert);
      setShowDetail(true);
    }
  };

  const onRenew = (certId: number) => {
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      setRenewCert(cert);
      setShowRenew(true);
    }
  };

  const onExport = (certId: number) => {
    modal.confirm({
      title: '导出证书与私钥',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>将导出该证书及其私钥，包含完整证书链。</p>
          <p style={{ color: '#faad14', fontSize: '12px' }}>请妥善保管导出的私钥文件！</p>
        </div>
      ),
      okText: '导出',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.certificates.export(certId);
          message.success('导出成功');
        } catch (err) {
          message.error('导出失败');
          console.error('Failed to export certificate:', err);
        }
      },
    });
  };

  // 删除证书确认
  const onDelete = async (certId: number) => {
    setShowDeleteConfirm(true);
    await modal.confirm({
      title: '确认删除证书',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除该证书及所有子证书吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>此操作不可恢复，请谨慎操作！</p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.certificates.delete(certId);
          message.success('证书删除成功');
          refreshCertificates();
          setSelectedCertId(null);
        } catch (error) {
          message.error('删除证书失败');
          console.error('Failed to delete certificate:', error);
        }
      },
    });
    setShowDeleteConfirm(false);
  };

  const refreshCertificates = async () => {
    if (selectedNs) {
      try {
        // 同时刷新证书列表和空间列表
        const [certList, namespaceList] = await Promise.all([
          api.certificates.list(selectedNs),
          api.namespaces.list(),
        ]);
        setCerts(certList);
        setNamespaces(namespaceList);
      } catch (error) {
        message.error('刷新数据失败');
        console.error('Failed to refresh data:', error);
      }
    }
  };

  const selectedNamespace = namespaces.find(ns => ns.id === selectedNs);

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
            证书管理
          </Title>
          {selectedNs && certs.length === 0 && certsLoading === false && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onIssue(0)}>
              创建根证书
            </Button>
          )}
        </div>

        {/* 空间选择区域 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space align="center" size="middle">
            <span style={{ fontWeight: 500, color: '#262626' }}>空间：</span>
            <Select
              onChange={setSelectedNs}
              loading={namespacesLoading}
              style={{ minWidth: 200 }}
              placeholder="请选择空间"
              notFoundContent={namespacesLoading ? '加载中...' : '暂无空间'}
              showSearch
              filterOption={(input, option) =>
                option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {namespaces.map(ns => (
                <Option key={ns.id} value={ns.id} label={ns.name}>
                  <Space>
                    <span>{ns.name}</span>
                    {ns.certCount > 0 && (
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        ({ns.certCount} 个证书)
                      </span>
                    )}
                  </Space>
                </Option>
              ))}
            </Select>
            {selectedNamespace && (
              <Space size="small" style={{ color: '#666', fontSize: '13px' }}>
                <DatabaseOutlined />
                <span>共 {selectedNamespace.certCount} 个证书</span>
              </Space>
            )}
          </Space>
        </Card>

        {/* 证书树区域 */}
        <div style={{ flex: 1, overflow: 'scroll' }}>
          {!selectedNs ? (
            <Card style={{ height: '100%' }}>
              <Empty description="请先选择空间" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : (
            <Card loading={certsLoading}>
              {certs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Empty description="暂无证书" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500, fontSize: 16 }}>证书树</span>
                    <InfoCircleOutlined
                      style={{ color: '#1677ff', marginLeft: 8, cursor: 'pointer' }}
                      onClick={() => setShowTreeHelp(true)}
                    />
                  </div>
                  <TreeWithContextMenu
                    certs={certs}
                    onIssue={onIssue}
                    onDelete={onDelete}
                    onViewDetails={onViewDetails}
                    onRenew={onRenew}
                    onExport={onExport}
                    setSelectedCertId={setSelectedCertId}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <CreateCertModal
        open={showCreate}
        namespaceId={selectedNs}
        issuerId={issuerId}
        onClose={() => {
          setShowCreate(false);
          setIssuerId(0);
        }}
        onSuccess={refreshCertificates}
      />
      <CertificateDetailModal
        open={showDetail}
        cert={detailCert}
        onClose={() => setShowDetail(false)}
      />
      <RenewCertModal
        open={showRenew}
        cert={renewCert}
        onClose={() => setShowRenew(false)}
        onSuccess={refreshCertificates}
      />
      <AntdModal
        open={showTreeHelp}
        title="证书树操作说明"
        onCancel={() => setShowTreeHelp(false)}
        footer={null}
        width={480}
      >
        <ul style={{ lineHeight: 2, fontSize: 15 }}>
          <li>
            <b>右键</b>：弹出操作菜单（签发、删除、查看详情、查看私钥、续期等）
          </li>
          <li>
            <b>双击</b>：查看证书详情
          </li>
          <li>
            <b>Delete/Backspace</b>：删除选中证书
          </li>
          <li>
            <b>Enter/空格</b>：查看证书详情
          </li>
          <li>
            <b>S</b>：签发证书（仅CA证书）
          </li>
          <li>
            <b>R</b>：续期证书
          </li>
          <li>
            <b>E</b>：导出证书与私钥
          </li>
        </ul>
      </AntdModal>
    </div>
  );
}

const TreeWithContextMenu = ({
  certs,
  onIssue,
  onViewDetails,
  onRenew,
  onDelete,
  onExport,
  setSelectedCertId,
}: {
  certs: Certificate[];
  onIssue: (id: number) => void;
  onViewDetails: (id: number) => void;
  onRenew: (id: number) => void;
  onDelete: (id: number) => void;
  onExport: (id: number) => void;
  setSelectedCertId: (id: number | null) => void;
}) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [contextMenuInfo, setContextMenuInfo] = useState({
    visible: false,
    pageX: 0,
    pageY: 0,
    node: null as TreeDataNode | null,
  });

  const onRightClick = ({ event, node }: { event: React.MouseEvent; node: TreeDataNode }) => {
    event.preventDefault();
    setContextMenuInfo({
      visible: true,
      pageX: event.pageX,
      pageY: event.pageY,
      node,
    });
  };
  const items: MenuProps['items'] = [
    {
      key: 'viewDetails',
      label: (
        <Space>
          <EyeOutlined />
          查看详情
        </Space>
      ),
    },
    // 只有CA证书才显示签发菜单
    ...(contextMenuInfo.node &&
    certs.find(c => c.id === (contextMenuInfo.node?.key as number) && c.isCA)
      ? [
          {
            key: 'issue',
            label: (
              <Space>
                <SafetyCertificateOutlined />
                签发证书
              </Space>
            ),
          },
        ]
      : []),
    {
      key: 'renew',
      label: (
        <Space>
          <ReloadOutlined />
          续期证书
        </Space>
      ),
    },
    {
      key: 'export',
      label: (
        <Space>
          <ExportOutlined />
          导出证书与私钥
        </Space>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: (
        <Space>
          <DeleteOutlined />
          删除证书
        </Space>
      ),
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setContextMenuInfo({ ...contextMenuInfo, visible: false });

    const certId = contextMenuInfo.node?.key as number;
    switch (key) {
      case 'issue':
        onIssue(certId);
        break;
      case 'viewDetails':
        onViewDetails(certId);
        break;
      case 'renew':
        onRenew(certId);
        break;
      case 'export':
        onExport(certId);
        break;
      case 'delete':
        onDelete(certId);
        break;
    }
  };

  const treeData = convertCert(certs);

  useEffect(() => {
    setExpandedKeys(certs.map(item => item.id));
  }, [certs]);

  return (
    <div>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: contextMenuInfo.visible ? 'block' : 'none',
        }}
        onClick={() => setContextMenuInfo({ ...contextMenuInfo, visible: false })}
      ></div>
      <Tree
        expandedKeys={expandedKeys}
        onExpand={(keys, _info) => {
          setExpandedKeys(keys);
        }}
        onRightClick={onRightClick}
        onDoubleClick={(_event, node) => {
          onViewDetails(node.key as number);
        }}
        onSelect={selectedKeys => {
          setSelectedCertId(selectedKeys.length > 0 ? (selectedKeys[0] as number) : null);
        }}
        treeData={treeData}
      />
      {contextMenuInfo.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenuInfo.pageY,
            left: contextMenuInfo.pageX,
            zIndex: 9999,
          }}
        >
          <Dropdown menu={{ items, onClick: handleMenuClick }} open>
            <div />
          </Dropdown>
        </div>
      )}
    </div>
  );
};

function convertCert(certs: Certificate[]): TreeDataNode[] {
  const certMap = new Map<number, TreeDataNode>();

  // 将所有证书转换为 Cert 并存入 Map
  certs.forEach(cert => {
    const title = (
      <Tooltip title={cert.desc || '无描述'}>
        <span style={{ userSelect: 'none' }}>
          {cert.subject}
          {cert.usage && (
            <Tag color="blue" style={{ marginLeft: 6, fontSize: 10, verticalAlign: 'middle' }}>
              {cert.usage}
            </Tag>
          )}
        </span>
      </Tooltip>
    );
    certMap.set(cert.id, { key: cert.id, title, children: [] });
  });

  const root: TreeDataNode[] = [];

  // 组织树形结构
  certs.forEach(cert => {
    const currentCert = certMap.get(cert.id)!;
    if (cert.issuerId === 0 || !certMap.has(cert.issuerId)) {
      // 如果 issuerId 为 0 或找不到父级，认为是根节点
      root.push(currentCert);
    } else {
      const parent = certMap.get(cert.issuerId)!;
      parent.children!.push(currentCert);
    }
  });

  return root;
}
