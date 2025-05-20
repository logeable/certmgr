import { useState } from 'react';

function CreateNamespace({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleCreate = () => {
    onCreate(name);
  };

  return (
    <div>
      <input type="text" value={name} onChange={e => setName(e.target.value)} />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

export default CreateNamespace;
