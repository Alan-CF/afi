import { useState, useEffect } from "react";
import { Bars3Icon, ShoppingBagIcon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { NavLink, useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import Cart from "./Cart";

const PRIMARY_LINKS = [
    { to: "/",           label: "Home" },
    { to: "/shop",       label: "Shop" },
    { to: "/news",       label: "News" },
    { to: "/events",     label: "Events" },
    { to: "/stats",      label: "Stats" },
    { to: "/legacy",     label: "Legacy" },
    { to: "/fanatic",    label: "Fanatic" },
    { to: "/rooms",      label: "Rooms" },
    { to: "/ranking",    label: "Leaderboard" },
];

export default function NavBar() {
    const { user } = useProfile();
    const navigate = useNavigate();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMenuOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsMenuOpen(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    return (
        <>
            <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 py-3 bg-secondary text-white md:px-6">
                <button onClick={() => navigate("/")} className="shrink-0 cursor-pointer" aria-label="Go to home">
                    <img src="/logo.png" alt="AFI" className="h-10" />
                </button>

                <ul className="hidden md:flex flex-1 items-center justify-center gap-1">
                    {PRIMARY_LINKS.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.to === "/"}
                                className={({ isActive }) =>
                                    `px-3 py-2 font-lato text-sm font-bold uppercase tracking-wider transition-all duration-150 ${
                                        isActive
                                            ? "text-primary font-black border-b-2 border-primary pb-0.5"
                                            : "text-white hover:text-primary/80"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-3 md:gap-5 shrink-0">
                    <button onClick={() => setIsCartOpen(true)} type="button" className="cursor-pointer" aria-label="Open cart">
                        <ShoppingBagIcon className="w-6 h-6" />
                    </button>
                    <button type="button" className="md:hidden cursor-pointer" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <button type="button" onClick={() => navigate("/myprofile")} className="cursor-pointer" aria-label="Go to profile">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <UserCircleIcon className="w-10 h-10" />
                        )}
                    </button>
                </div>
            </nav>

            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <div
                className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-300 ${
                    isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                className={`fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-secondary text-white md:hidden transition-transform duration-300 ease-in-out ${
                    isMenuOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex justify-end p-4">
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 text-white cursor-pointer" aria-label="Close menu">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <ul className="flex flex-1 flex-col overflow-y-auto">
                    {PRIMARY_LINKS.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.to === "/"}
                                onClick={() => setIsMenuOpen(false)}
                                className="group block"
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className={`block px-6 py-4 font-anton tracking-wide transition-all duration-150 ${
                                            isActive
                                                ? "text-primary text-3xl tracking-widest"
                                                : "text-white text-2xl group-hover:text-white/70"
                                        }`}>
                                            {link.label}
                                        </span>
                                        <span className={`block h-0.5 mx-4 transition-colors ${
                                            isActive ? "bg-primary" : "bg-white/20"
                                        }`} />
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}

                    <li className="mt-auto">
                        <NavLink
                            to="/myprofile"
                            onClick={() => setIsMenuOpen(false)}
                            className="group block"
                        >
                            {({ isActive }) => (
                                <span className={`block px-6 py-5 font-anton tracking-wide transition-all duration-150 ${
                                    isActive
                                        ? "text-primary text-3xl tracking-widest"
                                        : "text-white text-2xl group-hover:text-white/70"
                                }`}>
                                    Profile
                                </span>
                            )}
                        </NavLink>
                    </li>
                </ul>
            </aside>
        </>
    );
}
