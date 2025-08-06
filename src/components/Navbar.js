// components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaPaw,
  FaShoppingCart,
  FaUserAlt,
  FaPlus,
  FaSearch,
  FaArrowLeft,
} from 'react-icons/fa';
import { useState } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  
  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
 
  return (
    <nav className="bg-black text-white p-4 flex justify-between items-center shadow-md" key={user?.user_id || 'guest'}>
      <button
        onClick={() => navigate(-1)}
        className="text-white mr-4 hover:text-teal-300 transition-colors duration-300"
        title="ย้อนกลับ"
      >
        <FaArrowLeft size={26} />
      </button>

      <span className="text-2xl font-extrabold tracking-wide text-white">🐾 PetShop</span>

      <div className="flex items-center bg-white rounded-full px-3 py-1 mx-4 flex-grow max-w-lg">
        <input
          type="text"
          placeholder="Search products..."
          className="focus:outline-none text-black bg-transparent w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>
          <FaSearch className="text-black ml-2" />
        </button>
      </div>

      <div className="flex items-center space-x-6 text-lg font-medium">
        <Link to="/" title="หน้าแรก" className="hover:text-teal-300 transition-colors duration-300">
          <FaHome size={26} />
        </Link>
        <Link to="/pets" title="สัตว์เลี้ยง" className="hover:text-teal-300 transition-colors duration-300">
          <FaPaw size={26} />
        </Link>
        <Link to="/cart" title="ตะกร้าสินค้า" className="hover:text-teal-300 transition-colors duration-300">
          <FaShoppingCart size={26} />
        </Link>
        <Link
          to="/seller-dashboard"
          title="จัดการสินค้า"
          className="bg-green-500 hover:bg-green-600 transition-colors duration-300 rounded-full p-2"
        >
          <FaPlus size={20} />
        </Link>

        {user ? (
          <Link to="/profile" title="โปรไฟล์" className="hover:text-teal-300 transition-colors duration-300">
            {user.profileImage && user.profileImage.trim() !== '' ? (
              <img
                src={`${user.profileImage}?t=${Date.now()}`}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <FaUserAlt size={28} className="w-8 h-8 p-1 rounded-full bg-white text-black" />
            )}
          </Link>
        ) : (
          <Link to="/login" title="เข้าสู่ระบบ" className="hover:text-teal-300 transition-colors duration-300">
            เข้าสู่ระบบ
          </Link>
        )}
      </div>
    </nav>
  );
}
