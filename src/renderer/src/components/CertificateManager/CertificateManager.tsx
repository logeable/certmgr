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
} from 'antd';
import { DatabaseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import CreateCertModal from './CreateCertModal';
import CertificateDetailModal from './CertificateDetailModal';
import PrivateKeyModal from './PrivateKeyModal';
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
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyCert, setPrivateKeyCert] = useState<Certificate | null>(null);
  const [showRenew, setShowRenew] = useState(false);
  const [renewCert, setRenewCert] = useState<Certificate | null>(null);
  const [namespacesLoading, setNamespacesLoading] = useState(false);
  const [certsLoading, setCertsLoading] = useState(false);
  const { message, modal } = App.useApp();

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
          // 检查是否有根证书
          const hasRoot = list.some(cert => cert.issuerId === 0);
          if (!hasRoot) setShowCreate(true);
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

  const onViewPrivateKey = (certId: number) => {
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      setPrivateKeyCert(cert);
      setShowPrivateKey(true);
    }
  };

  const onRenew = (certId: number) => {
    const cert = certs.find(c => c.id === certId);
    if (cert) {
      setRenewCert(cert);
      setShowRenew(true);
    }
  };

  // 删除证书确认
  const onDelete = (certId: number) => {
    modal.confirm({
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
        } catch (error) {
          message.error('删除证书失败');
          console.error('Failed to delete certificate:', error);
        }
      },
    });
  };

  const refreshCertificates = async () => {
    if (selectedNs) {
      try {
        const list = await api.certificates.list(selectedNs);
        setCerts(list);
      } catch (error) {
        message.error('刷新证书列表失败');
        console.error('Failed to refresh certificates:', error);
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
              <Empty description="请先一个空间" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Card>
          ) : (
            <Card loading={certsLoading}>
              {certs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Empty description="暂无证书" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  <Button style={{}} type="primary" onClick={() => setShowCreate(true)}>
                    创建根证书
                  </Button>
                </div>
              ) : (
                <TreeWithContextMenu
                  treeData={convertCert(certs)}
                  onIssue={onIssue}
                  onViewDetails={onViewDetails}
                  onViewPrivateKey={onViewPrivateKey}
                  onRenew={onRenew}
                  onDelete={onDelete}
                />
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
      <PrivateKeyModal
        open={showPrivateKey}
        cert={privateKeyCert}
        onClose={() => setShowPrivateKey(false)}
      />
      <RenewCertModal
        open={showRenew}
        cert={renewCert}
        onClose={() => setShowRenew(false)}
        onSuccess={refreshCertificates}
      />
    </div>
  );
}

const TreeWithContextMenu = ({
  treeData,
  onIssue,
  onViewDetails,
  onViewPrivateKey,
  onRenew,
  onDelete,
}: {
  treeData: TreeDataNode[];
  onIssue: (id: number) => void;
  onViewDetails: (id: number) => void;
  onViewPrivateKey: (id: number) => void;
  onRenew: (id: number) => void;
  onDelete: (id: number) => void;
}) => {
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
  const menuItems = [
    {
      key: 'issue',
      label: '签发',
      onClick: () => onIssue(contextMenuInfo.node?.key as number),
    },
    {
      key: 'viewDetails',
      label: '查看详情',
      onClick: () => onViewDetails(contextMenuInfo.node?.key as number),
    },
    {
      key: 'viewPrivateKey',
      label: '查看私钥',
      onClick: () => onViewPrivateKey(contextMenuInfo.node?.key as number),
    },
    {
      key: 'renew',
      label: '续期',
      onClick: () => onRenew(contextMenuInfo.node?.key as number),
    },
    {
      key: 'delete',
      label: '删除',
      onClick: () => onDelete(contextMenuInfo.node?.key as number),
    },
  ];

  const items: MenuProps['items'] = menuItems.map(item => ({
    key: item.key,
    label: item.label,
    onClick: () => {
      setContextMenuInfo({ ...contextMenuInfo, visible: false });
      item.onClick();
    },
  }));

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
      <Tree multiple defaultExpandAll onRightClick={onRightClick} treeData={treeData} />
      {contextMenuInfo.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenuInfo.pageY,
            left: contextMenuInfo.pageX,
            zIndex: 9999,
          }}
        >
          <Dropdown menu={{ items }} open>
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
    certMap.set(cert.id, { key: cert.id, title: cert.subject, children: [] });
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
