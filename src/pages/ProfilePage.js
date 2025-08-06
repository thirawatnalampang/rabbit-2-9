import React, { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [gender, setGender] = useState(user?.gender || '');

  const usernameRef = useRef();
  const emailRef = useRef();
  const phoneRef = useRef();
  const addressRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function fetchUser() {
      try {
        const res = await fetch(`/api/users/${user.user_id}`);
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();

        login({
          user_id: data.user_id,
          username: data.username,
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          gender: data.gender || '',
          profileImage: data.profile_image || null,
        });
      } catch (err) {
        console.error(err);
      }
    }

    fetchUser();
  }, [user, navigate, login]);

  useEffect(() => {
    if (user?.gender !== undefined) {
      setGender(user.gender || '');
    }
  }, [user?.gender]);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  if (!user) return null;

  const uploadAndUpdateProfileImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('❌ อัปโหลดรูปไม่สำเร็จ');
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      const updateRes = await fetch(`/api/users/${user.user_id}/profile-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: imageUrl }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || '❌ เปลี่ยนรูปไม่สำเร็จ');

      const imageUrlWithTimestamp = imageUrl + '?t=' + new Date().getTime();
      login({ ...updateData.user, profileImage: imageUrlWithTimestamp });
      setPreviewUrl(imageUrlWithTimestamp);
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      uploadAndUpdateProfileImage(file);
    }
  };

  const handleSave = async () => {
    try {
      const phoneValue = phoneRef.current.value.trim();

      if (phoneValue !== '' && phoneValue.length !== 10) {
        alert('กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 ตัว');
        return;
      }

      let profileImageUrl = user.profileImage;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('profileImage', selectedImage);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('❌ อัปโหลดรูปไม่สำเร็จ');
        const uploadData = await uploadRes.json();
        profileImageUrl = uploadData.url + '?t=' + new Date().getTime();
      }

      const updatedUser = {
        username: usernameRef.current.value,
        email: emailRef.current.value,
        phone: phoneValue,
        address: addressRef.current.value,
        gender: gender,
        profileImage: profileImageUrl,
      };

      const res = await fetch(`/api/users/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '❌ บันทึกข้อมูลไม่สำเร็จ');

      login({
        user_id: data.user_id,
        username: data.username,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        gender: data.gender || '',
        profileImage: data.profile_image || null,
      });

      alert('✅ บันทึกข้อมูลสำเร็จ');
      setSelectedImage(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // ฟังก์ชัน logout สำหรับปุ่ม Logout
  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-20 md:w-48 bg-black flex flex-col items-center py-6 space-y-10">
        {/* เอารูปโปรไฟล์ออกเลย */}
        {/* <img
          src={previewUrl || user.profileImage || 'https://via.placeholder.com/100'}
          alt="profile"
          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
        /> */}
        <div className="text-sm md:text-base font-semibold">Profile</div>
      </div>

      <div className="flex-1 bg-white text-black rounded-tl-3xl p-8 overflow-auto">
        <h2 className="text-xl font-bold mb-4">EDIT YOUR PROFILE</h2>

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
              pattern="\d{10}"
              title="กรุณากรอกเบอร์โทรศัพท์ 10 ตัวเลข"
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
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
