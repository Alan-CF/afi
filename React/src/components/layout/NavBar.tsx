import { useState, useEffect } from 'react';
import {
  Bars3Icon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useCart } from '../../hooks/useCart';
import Cart from './Cart';
import ProfileIcon from '../ui/ProfileIcon';

const PRIMARY_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/events', label: 'Events' },
  { to: '/stats', label: 'Stats' },
  { to: '/legacy', label: 'Legacy' },
  { to: '/ranking', label: 'Leaderboard' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/games', label: 'Games' },
  { to: '/shop', label: 'Shop' },
  { to: '/eshop', label: 'eShop' },
];

export default function NavBar() {
  const {
    user,
    loading: profileLoading,
    error: profileError,
    hasLoadedOnce,
  } = useProfile();

  const { cartItems, loading: cartLoading, error: cartError } = useCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoggedIn = hasLoadedOnce && user !== null;
  const isLoggedOut = hasLoadedOnce && user === null;

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-secondary text-white">
        <div className="mx-auto w-full max-w-[1280px] flex items-center justify-between gap-2 px-3 py-3 min-[900px]:px-4 xl:px-8">
          <button
            onClick={() => navigate('/')}
            className="shrink-0 cursor-pointer"
            aria-label="Go to home"
          >
            <img src="/logo.png" alt="AFI" className="h-10" />
          </button>

          <ul className="hidden min-[900px]:flex flex-1 min-w-0 items-center justify-center gap-0 xl:gap-3">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `whitespace-nowrap px-1.5 lg:px-2 xl:px-3 py-2 font-lato text-[0.68rem] lg:text-xs xl:text-sm font-black uppercase tracking-normal xl:tracking-wider transition-colors ${
                      isActive
                        ? 'text-primary border-b-2 border-primary pb-0.5'
                        : 'text-white hover:text-primary/80'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 lg:gap-2 xl:gap-4 shrink-0">
            {isLoggedIn && user && (
              <button
                type="button"
                onClick={() => navigate('/eshop')}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 min-[900px]:px-3 py-1 font-lato text-xs min-[900px]:text-sm font-semibold text-white transition-colors hover:bg-white/20"
                aria-label="Open eShop"
                title="e-coins balance"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary font-anton text-[10px] text-secondary">
                  e
                </span>
                <span className="tabular-nums">
                  {(user.e_coins ?? 0).toLocaleString()}
                </span>
              </button>
            )}
            {(isLoggedIn || profileLoading) &&
              (() => {
                const cartDisabled = profileLoading || !isLoggedIn;
                const cartCount = cartItems.length;
                const showCartCount =
                  cartCount > 0 && !cartLoading && !cartError;
                return (
                  <button
                    onClick={() => !cartDisabled && setIsCartOpen(true)}
                    type="button"
                    className={`group relative ${cartDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={cartDisabled ? 'Cart disabled' : 'Open cart'}
                    aria-disabled={cartDisabled}
                    disabled={cartDisabled}
                  >
                    <ShoppingBagIcon className="w-6 h-6" />
                    {cartLoading ? (
                      <span
                        className="skeleton-shimmer absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center overflow-hidden rounded-full"
                        aria-hidden="true"
                      ></span>
                    ) : showCartCount ? (
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-secondary shadow-sm">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    ) : null}
                  </button>
                );
              })()}
            {!isLoggedOut ? (
              <button
                type="button"
                onClick={() => navigate('/myprofile')}
                className="cursor-pointer"
                aria-label="Go to profile"
              >
                <ProfileIcon
                  user={user}
                  userLoading={profileLoading}
                  userError={profileError}
                  hasLoadedOnce={hasLoadedOnce}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-1 min-[900px]:px-4 min-[900px]:py-1.5 font-lato text-[0.7rem] min-[900px]:text-sm font-bold uppercase tracking-wider text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Log in"
              >
                Log in
              </button>
            )}
            <button
              type="button"
              className="min-[900px]:hidden cursor-pointer"
              aria-label="Open menu"
              onClick={() => setIsMenuOpen(true)}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div
        className={`fixed inset-0 z-40 bg-black/40 min-[900px]:hidden transition-opacity duration-300 ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-full sm:w-[86vw] sm:max-w-sm flex-col overflow-y-auto bg-secondary text-white min-[900px]:hidden pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+1rem)] transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4 shrink-0">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 text-white cursor-pointer"
            aria-label="Close menu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <ul className="flex flex-1 flex-col">
          {PRIMARY_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                onClick={() => setIsMenuOpen(false)}
                className="group block"
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`block px-6 py-3 sm:py-4 font-anton tracking-wide transition-all duration-150 ${
                        isActive
                          ? 'text-primary text-2xl sm:text-3xl tracking-widest'
                          : 'text-white text-xl sm:text-2xl group-hover:text-white/70'
                      }`}
                    >
                      {link.label}
                    </span>
                    <span
                      className={`block h-0.5 mx-4 transition-colors ${
                        isActive ? 'bg-primary' : 'bg-white/20'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {isLoggedIn && (
            <li className="mt-auto">
              <NavLink
                to="/myprofile"
                onClick={() => setIsMenuOpen(false)}
                className="group block"
              >
                {({ isActive }) => (
                  <span
                    className={`block px-6 py-4 sm:py-5 font-anton tracking-wide transition-all duration-150 ${
                      isActive
                        ? 'text-primary text-2xl sm:text-3xl tracking-widest'
                        : 'text-white text-xl sm:text-2xl group-hover:text-white/70'
                    }`}
                  >
                    Profile
                  </span>
                )}
              </NavLink>
            </li>
          )}
          {isLoggedOut && (
            <li className="mt-auto p-6">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full rounded-xl bg-primary py-3 font-lato font-bold uppercase text-secondary transition-all duration-200 active:scale-[0.98]"
              >
                Log in
              </button>
            </li>
          )}
        </ul>
      </aside>
    </>
  );
}
