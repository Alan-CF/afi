import NavBar from './NavBar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import { useState, type Dispatch, type SetStateAction } from 'react';

export type MainLayoutOutletContext = {
  setIsFooterPushedByChat: Dispatch<SetStateAction<boolean>>;
};

export default function MainLayout() {
  const [isFooterPushedByChat, setIsFooterPushedByChat] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <Outlet context={{ setIsFooterPushedByChat }} />
      <Footer
        className={`transition-[padding] duration-300 ${
          isFooterPushedByChat ? 'md:pr-[30rem]' : ''
        }`}
      />
    </div>
  );
}
