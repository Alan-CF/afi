import NavBar from './NavBar';
import Footer from './Footer';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import BasketballLoader from '../common/BasketballLoader';

export type MainLayoutOutletContext = {
  setIsFooterPushedByChat: Dispatch<SetStateAction<boolean>>;
};

function isAdminAllowedPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/shop');
}

export default function MainLayout() {
  const [isFooterPushedByChat, setIsFooterPushedByChat] = useState(false);
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-text-light-soft">
        <BasketballLoader size="lg" />
      </div>
    );
  }

  if (isAdmin && !isAdminAllowedPath(location.pathname)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <Outlet context={{ setIsFooterPushedByChat }} />
      {!isAdmin && (
        <Footer
          className={`transition-[padding] duration-300 ${
            isFooterPushedByChat ? 'md:pr-[30rem]' : ''
          }`}
        />
      )}
    </div>
  );
}
