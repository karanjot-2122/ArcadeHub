import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Friends = () => {
  const { token } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const axiosConfig = useMemo(() => ({ headers: { 'x-auth-token': token } }), [token]);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/friends`, axiosConfig);
      setFriends(res.data.friends || []);
      if (socketRef.current?.connected) {
        socketRef.current.emit('request-friends-online-snapshot');
      }
    } catch (err) {
      console.error('fetch friends error', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/requests`, axiosConfig);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('fetch requests error', err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchFriends();
    fetchRequests();

    socketRef.current = io(API_URL, { auth: { token: `Bearer ${token}` } });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('request-friends-online-snapshot');
    });

    socketRef.current.on('friends-online-snapshot', ({ onlineFriendIds = [] }) => {
      const onlineSet = new Set(onlineFriendIds.map(String));
      setFriends((prev) => prev.map((f) => ({ ...f, isOnline: onlineSet.has(String(f.id)) })));
    });

    socketRef.current.on('friend-status', ({ userId, isOnline }) => {
      setFriends((prev) => prev.map((f) => (String(f.id) === String(userId) ? { ...f, isOnline } : f)));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/friends/search?q=${encodeURIComponent(search)}`, axiosConfig);
      setSearchResults(res.data);
    } catch (err) {
      console.error('search error', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (targetUsername) => {
    try {
      await axios.post(`${API_URL}/api/friends/request`, { username: targetUsername }, axiosConfig);
      setStatusMsg('Friend request sent');
      setSearchResults((prev) => prev.filter((p) => p.username !== targetUsername));
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not send request');
    }
  };

  const acceptRequest = async (id) => {
    try {
      await axios.post(`${API_URL}/api/friends/request/${id}/accept`, {}, axiosConfig);
      setStatusMsg('Friend request accepted');
      fetchFriends();
      fetchRequests();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not accept request');
    }
  };

  const rejectRequest = async (id) => {
    try {
      await axios.post(`${API_URL}/api/friends/request/${id}/reject`, {}, axiosConfig);
      setStatusMsg('Friend request rejected');
      fetchRequests();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not reject request');
    }
  };

  const onlineFriends = friends.filter((f) => f.isOnline);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300 mb-2">Multiplayer hub</p>
        <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-white drop-shadow-lg mb-3">Friends</h1>
        <p className="text-sm text-gray-300">👥 Connect with other players, add friends, and manage your social network.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 rounded-2xl border-2 border-lime-300/30 bg-gradient-to-b from-gray-950 to-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300 mb-3">Search players</p>
          <div className="space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border-2 border-gray-700 outline-none text-white placeholder:text-gray-500 focus:border-lime-300 font-semibold transition-all"
              placeholder="Username..."
            />
            <button 
              onClick={handleSearch} 
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-wider transition-all"
            >
              🔍 Search
            </button>
          </div>
          {loading && <p className="text-sm mt-3 text-lime-300 font-semibold">⏳ Searching...</p>}
          {statusMsg && <p className="text-sm mt-3 text-yellow-300 font-semibold">✨ {statusMsg}</p>}
        </section>

        <section className="lg:col-span-2 rounded-2xl border-2 border-lime-300/30 bg-gradient-to-b from-gray-950 to-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-lime-300 mb-4">Search results</p>
          {searchResults.length === 0 ? (
            <p className="text-gray-400 text-center py-8">🎮 Search for players to add as friends</p>
          ) : (
            <div className="grid gap-2">
              {searchResults.map((user) => (
                <div key={user.id} className="p-3 border-2 border-gray-700 rounded-lg bg-gray-900 flex justify-between items-center hover:border-lime-300/50 transition">
                  <div>
                    <p className="font-bold text-white">{user.username}</p>
                    <p className="text-xs text-gray-400">{user.isOnline ? '🟢 Online' : '⚫ Offline'}</p>
                  </div>
                  <button onClick={() => sendRequest(user.username)} className="px-3 py-1 bg-gradient-to-r from-lime-400 to-green-400 rounded-lg text-black font-bold text-xs hover:shadow-lg transition">
                    ➕ Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border-2 border-sky-300/30 bg-gradient-to-b from-gray-950 to-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-sky-300 mb-4">📬 Friend Requests</p>
          {requests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="p-4 border-2 border-gray-700 rounded-lg bg-gray-900 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <div>
                    <p className="font-bold text-white">{req.username}</p>
                    <p className="text-xs text-gray-400">Req: {new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptRequest(req.id)} className="px-3 py-1 bg-lime-400 rounded-lg text-black font-bold text-xs hover:bg-lime-300 transition">✓ Accept</button>
                    <button onClick={() => rejectRequest(req.id)} className="px-3 py-1 bg-red-600 rounded-lg text-white font-bold text-xs hover:bg-red-500 transition">✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border-2 border-orange-300/30 bg-gradient-to-b from-gray-950 to-black p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-300 mb-4">🟢 Online Friends ({onlineFriends.length})</p>
          {onlineFriends.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No friends online</p>
          ) : (
            <div className="grid gap-2">
              {onlineFriends.map((f) => (
                <div key={f.id} className="p-3 border-2 border-lime-300/30 rounded-lg bg-lime-300/10">
                  <p className="font-bold text-white">{f.username}</p>
                  <p className="text-xs text-lime-300">🟢 Online</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 rounded-2xl border-2 border-purple-300/30 bg-gradient-to-b from-gray-950 to-black p-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300 mb-4">👥 All Friends ({friends.length})</p>
        {friends.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Start adding friends!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {friends.map((f) => (
              <div key={f.id} className="p-3 border-2 border-gray-700 rounded-lg bg-gray-900/50 text-center hover:border-purple-300/50 transition">
                <p className="font-bold text-white">{f.username}</p>
                <p className="text-xs text-gray-400 mt-1">{f.isOnline ? '🟢 Online' : '⚫ Offline'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;