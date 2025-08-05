import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Pets from './pages/Pets';
import PetDetail from './pages/PetDetail';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import GetStartedPage from './pages/GetStartedPage';
import NotFound from './pages/NotFound';
import Food from './pages/Food';
import Equipment from './pages/Equipment';
import FoodDetail from './pages/FoodDetail';
import EquipmentDetail from './pages/EquipmentDetail';
import SellerDashboard from './pages/SellerDashboard';
import ManageRabbits from './pages/ManageRabbits';
import AddRabbitForm from './pages/AddRabbitForm';
import ManageOrdersPage from './pages/ManageOrdersPage'; 
import DeliveryStatus from './pages/DeliveryStatus';
import StatisticsPage from './pages/StatisticsPage';
import SearchPage from './pages/SearchPage';
import ParentsPage from './pages/ParentsPage'; 
import BookingPage from './pages/BookingPage';

import './App.css';

function App() {
  return (
    <>
      {/* ไม่ต้องส่ง user ผ่าน props เพราะใช้ Context */}
      <Navbar />

      <div className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/pet-food" element={<Food />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/pet-food/:id" element={<FoodDetail />} />
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/manage-rabbits" element={<ManageRabbits />} />
          <Route path="/add-rabbit" element={<AddRabbitForm />} />
          <Route path="/manage-orders" element={<ManageOrdersPage />} />
          <Route path="/shipping" element={<DeliveryStatus />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/parents" element={<ParentsPage />} />
          <Route path="/booking" element={<BookingPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

export default App;