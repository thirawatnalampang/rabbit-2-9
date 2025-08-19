import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [gender, setGender] = useState('');

  const usernameRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const addressRef = useRef();
  const fileInputRef = useRef();

  // Fetch user data on mount (เฉพาะครั้งแรก)
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${user.user_id}`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();

        const profileUrl = data.profile_image ? data.profile_image + '?t=' + Date.now() : null;

        setGender(data.gender || '');
        setPreviewUrl(profileUrl);

        // อัปเดต context แค่ profileImage ไม่ไปเปลี่ยน gender
        login({
          ...user,
          profileImage: profileUrl,
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update preview URL for selected image
  useEffect(() => {
    if (!selectedImage) return;
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  if (!user) return null;

  // Upload profile image
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      const newProfileUrl = uploadData.url + '?t=' + Date.now();

      const updateRes = await fetch(`/api/users/${user.user_id}/profile-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: newProfileUrl }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || 'Update failed');

      login({
        ...updateData.user,
        profileImage: newProfileUrl,
        role: updateData.user.role || 'user',
      });

      setPreviewUrl(newProfileUrl);
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleSave = async () => {
    try {
      const phoneValue = phoneRef.current.value.trim();
      if (phoneValue !== '' && phoneValue.length !== 10) {
        alert('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 ตัว');
        return;
      }

      const updatedUser = {
        username: usernameRef.current.value,
        email: emailRef.current.value,
        phone: phoneValue,
        address: addressRef.current.value,
        gender,
        profileImage: previewUrl || user.profileImage,
      };

      const res = await fetch(`/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');

      const profileUrl = data.profile_image ? data.profile_image + '?t=' + Date.now() : null;

      login({
        user_id: data.user_id,
        username: data.username,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || gender, // ใช้ local gender ถ้า data.gender ไม่มี
        profileImage: profileUrl,
        role: data.role || 'user',
      });

      setPreviewUrl(profileUrl);
      alert('✅ บันทึกข้อมูลสำเร็จ');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-20 md:w-48 bg-black flex flex-col items-center py-6 space-y-10">
        <div className="text-sm md:text-base font-semibold">Profile</div>
      </div>

      <div className="flex-1 bg-white text-black rounded-tl-3xl p-8 overflow-auto">
        <h2 className="text-xl font-bold mb-4">EDIT YOUR PROFILE</h2>

        {/* Profile Image */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white flex items-center justify-center bg-gray-200">
            {(previewUrl || user.profileImage) ? (
              <img
                src={previewUrl || user.profileImage}
                alt="profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20c0-2.21 3.58-4 6-4s6 1.79 6 4v1H6v-1z"
                />
              </svg>
            )}

            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute bottom-1 right-1 w-6 h-6 bg-white border-2 border-white rounded-full shadow flex items-center justify-center hover:bg-gray-100 transition"
              title="เปลี่ยนรูปโปรไฟล์"
              style={{ boxShadow: '0 0 4px rgba(0,0,0,0.15)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 112.828 2.828L11.828 13.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z"
                />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4 max-w-md mx-auto">
          <div>
            <label className="block text-sm font-semibold mb-1">Username</label>
            <input
              type="text"
              ref={usernameRef}
              className="w-full border-b border-black focus:outline-none p-1"
              defaultValue={user.username}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              ref={emailRef}
              className="w-full border-b border-black focus:outline-none p-1"
              defaultValue={user.email}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input
              type="tel"
              ref={phoneRef}
              className="w-full border-b border-black focus:outline-none p-1"
              defaultValue={user.phone}
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <input
              type="text"
              ref={addressRef}
              className="w-full border-b border-black focus:outline-none p-1"
              defaultValue={user.address}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full border-b border-black focus:outline-none p-1"
            >
              <option value="">เลือกเพศ</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
          >
            บันทึก
          </button>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleLogout}
            className="bg-black text-white px-6 py-2 rounded-full font-semibold hover:bg-gray-800 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
