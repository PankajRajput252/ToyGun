import React from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function ConditionalHome() {
  const { isAdmin } = useAuth();
  
  // Redirect admin users to admin dashboard, regular users to regular dashboard
  return isAdmin ? <Navigate to="/bandookwale/admin" replace /> : <Navigate to="/bandookwale/dashboard" replace />;
}
