import styles from './NamespaceManager.module.css';

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
  return (
    <div>
      <h2 className={styles.sectionTitle}>空间管理</h2>
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
    </div>
  );
}
