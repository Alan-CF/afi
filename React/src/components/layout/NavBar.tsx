import { useState } from "react";
import { Bars3Icon, ShoppingBagIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { NavLink, useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import Cart from "./Cart";

const PRIMARY_LINKS = [
    { to: "/",        label: "Home" },
    { to: "/shop",    label: "Shop" },
    { to: "/events",  label: "Events" }, // TODO(step-5-1): /events route created in Step 5.1
    { to: "/fanatic", label: "Fanatic" },
    { to: "/rooms",   label: "Rooms" },
    { to: "/ranking", label: "Leaderboard" },
];

export default function NavBar() {
    const { user } = useProfile();
    const navigate = useNavigate();
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <>
            <nav className="flex items-center justify-between gap-4 px-4 py-3 bg-secondary text-white md:px-6">
                <button
                    onClick={() => navigate("/")}
                    className="shrink-0 cursor-pointer"
                    aria-label="Go to home"
                >
                    <img src="/logo.png" alt="AFI" className="h-10" />
                </button>

                <ul className="hidden md:flex flex-1 items-center justify-center gap-1">
                    {PRIMARY_LINKS.map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.to === "/"}
                                className={({ isActive }) =>
                                    `px-3 py-2 rounded-xl font-lato text-sm font-bold uppercase tracking-wider transition-colors ${
                                        isActive
                                            ? "bg-primary text-secondary"
                                            : "text-white hover:bg-white/10"
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-3 md:gap-5 shrink-0">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        type="button"
                        className="cursor-pointer"
                        aria-label="Open cart"
                    >
                        <ShoppingBagIcon className="w-6 h-6" />
                    </button>

                    <button
                        type="button"
                        className="md:hidden cursor-pointer"
                        aria-label="Open menu"
                        // TODO(step-0-3): wire hamburger to drawer
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/myprofile")}
                        className="cursor-pointer"
                        aria-label="Go to profile"
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <UserCircleIcon className="w-10 h-10" />
                        )}
                    </button>
                </div>
            </nav>
            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
