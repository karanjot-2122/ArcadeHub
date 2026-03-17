import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../contexts/AuthContext';

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
      const res = await axios.get('http://localhost:5000/api/friends', axiosConfig);
      setFriends(res.data.friends || []);
    } catch (err) {
      console.error('fetch friends error', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/friends/requests', axiosConfig);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('fetch requests error', err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchFriends();
    fetchRequests();

    socketRef.current = io('http://localhost:5000', { auth: { token: `Bearer ${token}` } });

    socketRef.current.on('friend-status', ({ userId, isOnline }) => {
      setFriends((prev) => prev.map((f) => (f.id === userId ? { ...f, isOnline } : f)));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [token]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/friends/search?q=${encodeURIComponent(search)}`, axiosConfig);
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
      await axios.post('http://localhost:5000/api/friends/request', { username: targetUsername }, axiosConfig);
      setStatusMsg('Friend request sent');
      setSearchResults((prev) => prev.filter((p) => p.username !== targetUsername));
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not send request');
    }
  };

  const acceptRequest = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/friends/request/${id}/accept`, {}, axiosConfig);
      setStatusMsg('Friend request accepted');
      fetchFriends();
      fetchRequests();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not accept request');
    }
  };

  const rejectRequest = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/friends/request/${id}/reject`, {}, axiosConfig);
      setStatusMsg('Friend request rejected');
      fetchRequests();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Could not reject request');
    }
  };

  const onlineFriends = friends.filter((f) => f.isOnline);

  return (
    <div className="max-w-5xl mx-auto p-4 text-white">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">Friends</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Search Users</h2>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 outline-none"
            placeholder="Enter username"
          />
          <button onClick={handleSearch} className="px-4 rounded bg-indigo-600 hover:bg-indigo-500">
            Search
          </button>
        </div>
        {loading && <p className="text-sm mt-2">Searching...</p>}
        {statusMsg && <p className="text-sm mt-2 text-yellow-300">{statusMsg}</p>}
        {searchResults.length > 0 && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {searchResults.map((user) => (
              <div key={user.id} className="p-3 border border-gray-700 rounded bg-gray-900 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-xs text-gray-300">{user.isOnline ? 'Online' : 'Offline'}</p>
                </div>
                <button onClick={() => sendRequest(user.username)} className="px-3 py-1 bg-green-600 rounded hover:bg-green-500">
                  Send Request
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Requests Inbox</h2>
        {requests.length === 0 ? (
          <p className="text-gray-300">No pending friend requests.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div key={req.id} className="p-3 border border-gray-700 rounded bg-gray-900 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{req.username}</p>
                  <p className="text-xs text-gray-300">Requested at {new Date(req.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => acceptRequest(req.id)} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500">Accept</button>
                  <button onClick={() => rejectRequest(req.id)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-500">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All Friends</h2>
        {friends.length === 0 ? (
          <p className="text-gray-300">No friends yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {friends.map((f) => (
              <div key={f.id} className="p-3 border border-gray-700 rounded bg-gray-900 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{f.username}</p>
                  <p className="text-xs text-gray-300">{f.isOnline ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Online Friends</h2>
        {onlineFriends.length === 0 ? (
          <p className="text-gray-300">No friends online.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {onlineFriends.map((f) => (
              <div key={f.id} className="p-3 border border-gray-700 rounded bg-gray-900">
                <p className="font-semibold">{f.username}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Friends;