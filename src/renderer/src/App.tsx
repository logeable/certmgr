import { useEffect, useState } from 'react';
import CreateNamespace from './components/CreateNamespace';

type Namespace = {
  id: string;
  name: string;
};

function App() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  useEffect(() => {
    const fetchNamespaces = async () => {
      const namespaces = await window.api.namespaces.list();
      setNamespaces(namespaces);
    };
    fetchNamespaces();
  }, []);

  const handleCreate = async (name: string) => {
    await window.api.namespaces.create(name);

    const namespaces = await window.api.namespaces.list();
    setNamespaces(namespaces);
  };

  return (
    <div>
      <h1>Namespaces</h1>

      {namespaces.length === 0 && <CreateNamespace onCreate={handleCreate} />}
      {namespaces.length > 0 && (
        <ul>
          {namespaces.map(namespace => (
            <li key={namespace.id}>{namespace.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
