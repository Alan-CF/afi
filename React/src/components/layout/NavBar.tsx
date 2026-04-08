import { Bars3Icon, ShoppingBagIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";

export default function NavBar() {
    const { user } = useProfile();
    const navigate = useNavigate();

    return (
        <nav className="flex items-center justify-between p-4 bg-secondary text-white">
            <button onClick={ () => navigate("/")} className="cursor-pointer">
                <img src="/logo.png" alt="Logo" className="h-10"/>
            </button>
            <div className="flex items-center gap-5">
                <ShoppingBagIcon className="w-6 h-6" aria-hidden="true" />
                <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                {user?.avatar_url ? (
                    <img
                        src={user.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <UserCircleIcon className="w-10 h-10" aria-hidden="true" />
                )}
            </div>
        </nav>
    );
}
