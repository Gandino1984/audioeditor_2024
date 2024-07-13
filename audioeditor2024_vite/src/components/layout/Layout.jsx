import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import './Layout.css';

export const Layout = () => {

  const location = useLocation();
//   const { pathname } = location;

  return (
    <div className="layout">
        <Outlet />
    </div>
  );
};

export default Layout;
