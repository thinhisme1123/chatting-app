// 📁 frontend/src/App.tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3001');

function App() {
  const [userId, setUserId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ from: string; text: string }[]>([]);

  useEffect(() => {
    if (userId) {
      socket.emit('register-user', userId);
    }
  }, [userId]);

  useEffect(() => {
    socket.on('receive-message', ({ fromUserId, message }) => {
      setChat(prev => [...prev, { from: fromUserId, text: message }]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, []);

  const handleSend = () => {
    if (!userId || !targetId || !message) return;
    setChat(prev => [...prev, { from: userId, text: message }]);
    socket.emit('send-message', {
      fromUserId: userId,
      toUserId: targetId,
      message,
    });
    setMessage('');
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🟢 Simple Realtime Chat</h1>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Your User ID"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Target User ID"
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          className="border p-2"
        />
      </div>

      <div className="border h-64 overflow-y-auto p-2 bg-gray-100 mb-2">
        {chat.map((c, idx) => (
          <div key={idx} className={c.from === userId ? 'text-right' : 'text-left'}>
            <span className="inline-block bg-white px-3 py-1 rounded shadow mb-1">
              <strong>{c.from}:</strong> {c.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          type="text"
          placeholder="Type your message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-1 border p-2 mr-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
