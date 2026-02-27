import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-6 bg-gray-900 border-b border-gray-800 text-white shadow-xl">
      <Link to="/" className="text-2xl font-bold tracking-widest text-blue-500 hover:text-blue-400 transition">
        ARCADE<span className="text-white">HUB</span>
      </Link>
      <div className="space-x-8 font-medium">
        <Link to="/login" className="hover:text-blue-400 transition">Login</Link>
        <Link to="/register" className="bg-blue-600 px-5 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
          Join Now
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;