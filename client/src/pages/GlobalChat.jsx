import { useEffect, useState, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

const GlobalChat = () => {
  const { user, token } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io('http://localhost:5000', {
      auth: { token: `Bearer ${token}` },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('global-history', (history) => {
      setMessages(history || []);
    });

    // FILTER APPROACH: Only add the message if it's not the one we just sent
    socket.on('global-message', (payload) => {
      setMessages((prev) => {
        // If the last message in state matches the incoming payload (sender & text), 
        // it's likely the broadcast of our own message. Skip it.
        const lastMsg = prev[prev.length - 1];
        const isDuplicate = lastMsg && 
                           lastMsg.user === payload.user && 
                           lastMsg.text === payload.text;

        if (isDuplicate && payload.user === user.username) {
          return prev;
        }
        return [...prev, payload];
      });
    });

    // MEMORY LEAK FIX: Clean up all listeners
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('global-message');
      socket.off('global-history');
      socket.disconnect();
    };
  }, [token, user]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    const pad = (v) => String(v).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const sendMessage = () => {
  const text = (message || '').trim();
  if (!text || !socketRef.current) return;

  const payload = { 
    user: user.username || 'Unknown', 
    text, 
    // Let the server handle the timestamp if possible for consistency
    time: new Date().toISOString() 
  };

  // 1. Emit to server
  socketRef.current.emit('global-message', payload);
  
  // 2. REMOVE THIS LINE (The optimistic update)
  // setMessages((prev) => [...prev, payload]); 
  
  setMessage('');
};

  return (
    <div className="max-w-4xl mx-auto p-4 text-white">
      <h1 className="text-3xl font-bold text-blue-400 mb-4">Global Chat</h1>
      <p className="text-sm text-gray-300 mb-4">
        Status: <span className={connected ? 'text-green-400' : 'text-red-400'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </p>

      <div className="h-80 overflow-y-auto border border-gray-700 rounded-lg bg-gray-900 p-4 mb-4">
        {messages.map((m, idx) => {
          const isSelf = m.user === (user?.username || '');
          return (
            <div key={`${m.user}-${idx}-${m.time}`} className={`mb-2 flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2 rounded-lg ${isSelf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                <div className="text-xs text-gray-200 mb-1 flex items-center justify-between gap-4">
                  <span className="font-bold">{m.user}</span>
                  <span>{formatTime(m.time)}</span>
                </div>
                <div className="break-words">{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          className="flex-1 p-2 rounded border border-gray-700 bg-gray-800 focus:outline-none focus:border-blue-500"
          placeholder="Type a message..."
        />
        <button 
          onClick={sendMessage} 
          className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GlobalChat;