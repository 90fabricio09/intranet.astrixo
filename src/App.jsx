import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageCategories from './pages/ManageCategories';
import ManageCourses from './pages/ManageCourses';
import ManageUsers from './pages/ManageUsers';
import AdminCommunity from './pages/AdminCommunity';
import AdminCommunityChat from './pages/AdminCommunityChat';
import AdminTickets from './pages/AdminTickets';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/categories" 
            element={
              <AdminRoute>
                <ManageCategories />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/courses" 
            element={
              <AdminRoute>
                <ManageCourses />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/community" 
            element={
              <AdminRoute>
                <AdminCommunity />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/community/:categoryId" 
            element={
              <AdminRoute>
                <AdminCommunityChat />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/tickets" 
            element={
              <AdminRoute>
                <AdminTickets />
              </AdminRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
