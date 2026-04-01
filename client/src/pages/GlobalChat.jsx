import { useEffect, useState, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GlobalChat = () => {
  const { user, token } = useContext(AuthContext);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(API_URL, {
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300 mb-2">Community hub</p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">Global Chat</h1>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border-2 border-white/20">
            <span className={`w-3 h-3 rounded-full ${ connected ? 'bg-lime-400 shadow-lg shadow-lime-400/50' : 'bg-red-400'}`}></span>
            <span className={`text-sm font-bold uppercase tracking-wider ${ connected ? 'text-lime-300' : 'text-red-300'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-96 overflow-y-auto border-2 border-lime-300/30 rounded-2xl bg-gradient-to-b from-gray-950 to-black p-6 mb-4 shadow-xl">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-center">
            <div>
              <p className="text-3xl mb-2">💬</p>
              <p className="font-semibold">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isSelf = m.user === (user?.username || '');
            return (
              <div key={`${m.user}-${idx}-${m.time}`} className={`mb-3 flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl ${ isSelf ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30' : 'bg-gray-800/80 text-gray-100 border border-gray-700'}`}>
                  <div className="text-xs font-bold text-gray-200 mb-1 flex items-center justify-between gap-3">
                    <span>{isSelf ? '👤 You' : m.user}</span>
                    <span className="text-gray-300/70">{formatTime(m.time)}</span>
                  </div>
                  <div className="break-words text-sm">{m.text}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-700 bg-gray-900 focus:border-lime-300 focus:ring-2 focus:ring-lime-300/30 outline-none text-white font-semibold placeholder:text-gray-500 transition-all"
          placeholder="Type a message and press Enter..."
        />
        <button 
          onClick={sendMessage} 
          className="px-6 py-3 bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-300 hover:to-green-300 text-black rounded-xl font-black uppercase tracking-wider shadow-lg transition-all hover:shadow-[0_0_20px_rgba(205,220,57,0.5)]"
        >
          📤 Send
        </button>
      </div>
    </div>
  );
};

export default GlobalChat;