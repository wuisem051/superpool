import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  const isDevMode = process.env.REACT_APP_DEV_MODE === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080c] flex items-center justify-center text-gray-400 font-mono text-sm">
        Verificando credenciales de administración...
      </div>
    );
  }

  // Si está en modo dev, permitir acceso
  if (isDevMode) {
    return children;
  }

  // Si no hay usuario autenticado o no tiene rol de admin, redirigir a la página de login admin
  if (!currentUser || !isAdmin) {
    return <Navigate to="/introflow-login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;
