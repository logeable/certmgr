import { useEffect, useState } from 'react';

function App() {
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('');
  const [path, setPath] = useState({
    cwd: '',
    app: '',
    dir: '',
  });
  useEffect(() => {
    window.msg.ping().then(res => {
      console.log(res);
      setMsg(res);
    });
  }, []);

  useEffect(() => {
    window.msg.status().then(res => {
      console.log(res);
      setStatus(res.status);
    });
  }, []);

  useEffect(() => {
    window.msg.path().then(res => {
      setPath(res);
    });
  }, []);

  return (
    <div>
      <div>{msg}</div>
      <div>{status}</div>
      <div>cwd: {path.cwd}</div>
      <div>app: {path.app}</div>
      <div>dir: {path.dir}</div>
    </div>
  );
}

export default App;
