import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const Profile = () => {
  const { user, token } = useContext(AuthContext);

  return (
    <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl">
      <h1 className="text-3xl font-bold text-sky-400 mb-4">Profile</h1>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-blue-500 grid place-items-center text-white font-bold text-xl">P</div>
        <div>
          <p className="text-gray-200 font-semibold">Username: {user?.name || 'Guest'}</p>
          <p className="text-gray-400">Email: {user?.email || 'Not set'}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 break-words">Token: {token ? `${token.slice(0, 24)}...` : 'No token'}</p>
    </div>
  );
};

export default Profile;