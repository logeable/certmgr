import { useState, useEffect } from 'react';
import styles from './NamespaceManager.module.css';
import Modal from '../Modal/Modal';

export default function NamespaceManager() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [current, setCurrent] = useState<Namespace | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // 拉取空间列表
  const fetchNamespaces = async () => {
    if (window.api.namespaces?.list) {
      const list = await window.api.namespaces.list();
      // 兼容 desc 字段后端未返回的情况
      setNamespaces(
        list.map((ns: Namespace) => ({
          ...ns,
          desc: ns.desc ?? '',
        })),
      );
    }
  };

  useEffect(() => {
    fetchNamespaces();
  }, []);

  // 新建
  const handleOpenCreate = () => {
    setName('');
    setDesc('');
    setShowCreate(true);
  };
  const handleCreate = async () => {
    if (window.api.namespaces.create) {
      await window.api.namespaces.create(name, desc);
      setShowCreate(false);
      fetchNamespaces(); // 新建后刷新
    }
  };

  // 编辑
  const handleOpenEdit = (ns: Namespace) => {
    setCurrent(ns);
    setName(ns.name);
    setDesc(ns.desc);
    setShowEdit(true);
  };
  const handleEdit = async () => {
    if (!current) return;
    if (window.api.namespaces.edit) {
      await window.api.namespaces.edit(current.id, name, desc);
      setShowEdit(false);
      fetchNamespaces(); // 编辑后刷新
    }
  };

  // 删除
  const handleOpenDelete = (ns: Namespace) => {
    setCurrent(ns);
    setShowDelete(true);
  };
  const handleDelete = async () => {
    if (!current) return;
    if (window.api.namespaces.delete) {
      await window.api.namespaces.delete(current.id);
      setShowDelete(false);
      fetchNamespaces(); // 删除后刷新
    }
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
              <td>{new Date(ns.createdAt * 1000).toLocaleString()}</td>
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
