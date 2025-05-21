import { useState } from 'react';
import styles from './NamespaceManager.module.css';
import Modal from '../Modal/Modal';

interface Namespace {
  id: string;
  name: string;
  createdAt: string;
  certCount: number;
  desc: string;
}

const initialNamespaces: Namespace[] = [
  {
    id: '1',
    name: 'dev',
    createdAt: '2024-05-01',
    certCount: 5,
    desc: '开发环境空间',
  },
  {
    id: '2',
    name: 'prod',
    createdAt: '2024-04-15',
    certCount: 12,
    desc: '生产环境空间',
  },
];

export default function NamespaceManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>(initialNamespaces);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [current, setCurrent] = useState<Namespace | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // 新建
  const handleOpenCreate = () => {
    setName('');
    setDesc('');
    setShowCreate(true);
  };
  const handleCreate = () => {
    setNamespaces([
      ...namespaces,
      {
        id: Date.now().toString(),
        name,
        desc,
        createdAt: new Date().toISOString().slice(0, 10),
        certCount: 0,
      },
    ]);
    setShowCreate(false);
  };

  // 编辑
  const handleOpenEdit = (ns: Namespace) => {
    setCurrent(ns);
    setName(ns.name);
    setDesc(ns.desc);
    setShowEdit(true);
  };
  const handleEdit = () => {
    if (!current) return;
    setNamespaces(namespaces.map(ns => (ns.id === current.id ? { ...ns, name, desc } : ns)));
    setShowEdit(false);
  };

  // 删除
  const handleOpenDelete = (ns: Namespace) => {
    setCurrent(ns);
    setShowDelete(true);
  };
  const handleDelete = () => {
    if (!current) return;
    setNamespaces(namespaces.filter(ns => ns.id !== current.id));
    setShowDelete(false);
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>空间管理</h2>
      <div style={{ marginBottom: 16 }}>
        <button className={styles.btn} onClick={handleOpenCreate}>
          新建空间
        </button>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>空间名称</th>
            <th>创建时间</th>
            <th>证书数量</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {namespaces.map(ns => (
            <tr key={ns.id}>
              <td>{ns.name}</td>
              <td>{ns.createdAt}</td>
              <td>{ns.certCount}</td>
              <td>{ns.desc}</td>
              <td>
                <button
                  className={styles.btn + ' ' + styles.secondary}
                  onClick={() => handleOpenEdit(ns)}
                >
                  编辑
                </button>
                <button
                  className={styles.btn + ' ' + styles.danger}
                  onClick={() => handleOpenDelete(ns)}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 新建空间模态框 */}
      <Modal
        open={showCreate}
        title="新建空间"
        actions={
          <>
            <button className={styles.btn} onClick={handleCreate} disabled={!name.trim()}>
              确定
            </button>
            <button
              className={styles.btn + ' ' + styles.secondary}
              onClick={() => setShowCreate(false)}
            >
              取消
            </button>
          </>
        }
      >
        <label>
          空间名称<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入空间名称，必填"
          required
        />
        <label>描述</label>
        <textarea
          className={styles.textarea}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="可选，空间描述"
        />
      </Modal>
      {/* 编辑空间模态框 */}
      <Modal
        open={showEdit}
        title="编辑空间"
        actions={
          <>
            <button className={styles.btn} onClick={handleEdit} disabled={!name.trim()}>
              保存
            </button>
            <button
              className={styles.btn + ' ' + styles.secondary}
              onClick={() => setShowEdit(false)}
            >
              取消
            </button>
          </>
        }
      >
        <label>
          空间名称<span style={{ color: '#ff4d4f' }}>*</span>
        </label>
        <input
          className={styles.input}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="请输入空间名称，必填"
          required
        />
        <label>描述</label>
        <textarea
          className={styles.textarea}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="可选，空间描述"
        />
      </Modal>
      {/* 删除空间模态框 */}
      <Modal
        open={showDelete}
        title="确认删除空间"
        actions={
          <>
            <button className={styles.btn + ' ' + styles.danger} onClick={handleDelete}>
              删除
            </button>
            <button
              className={styles.btn + ' ' + styles.secondary}
              onClick={() => setShowDelete(false)}
            >
              取消
            </button>
          </>
        }
      >
        <div>确定要删除该空间及其下所有证书和私钥吗？此操作不可恢复。</div>
      </Modal>
    </div>
  );
}
