import { useEffect, useState } from 'react';

function App() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    window.msg.ping().then(res => {
      console.log(res);
      setMsg(res);
    });
  }, [msg]);
  return <div>{msg}</div>;
}

export default App;
