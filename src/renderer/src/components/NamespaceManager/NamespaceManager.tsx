import { useState } from 'react';
import styles from './NamespaceManager.module.css';
import Modal from '../Modal/Modal';

const mockNamespaces = [
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
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const handleOpen = () => {
    setName('');
    setDesc('');
    setShowModal(true);
  };
  const handleClose = () => setShowModal(false);
  const handleConfirm = () => {
    // 这里只关闭模态框，不做后端交互
    setShowModal(false);
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>空间管理</h2>
      <div style={{ marginBottom: 16 }}>
        <button className={styles.btn} onClick={handleOpen}>
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
          {mockNamespaces.map(ns => (
            <tr key={ns.id}>
              <td>{ns.name}</td>
              <td>{ns.createdAt}</td>
              <td>{ns.certCount}</td>
              <td>{ns.desc}</td>
              <td>
                <button className={styles.btn + ' ' + styles.secondary}>编辑</button>
                <button className={styles.btn + ' ' + styles.danger}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        open={showModal}
        title="新建空间"
        actions={
          <>
            <button className={styles.btn} onClick={handleConfirm}>
              确定
            </button>
            <button className={styles.btn + ' ' + styles.secondary} onClick={handleClose}>
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
    </div>
  );
}
