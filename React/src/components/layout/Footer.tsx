import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
    { label: "Home",        to: "/" },
    { label: "Shop",        to: "/shop" },
    { label: "Events",      to: "/events" },
    { label: "Statistics",  to: "/statistics" },
    { label: "Fanatic",     to: "/fanatic" },
    { label: "Rooms",       to: "/rooms" },
    { label: "Leaderboard", to: "/ranking" },
    { label: "Profile",     to: "/myprofile" },
];

export default function Footer() {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <footer className="bg-secondary text-white">
            <div className="mx-auto max-w-[1280px] px-6 md:px-8">

                <div className="flex flex-col gap-16 py-16 md:flex-row md:items-start md:justify-between">

                    <div className="flex flex-col gap-6 md:max-w-xs">
                        <img src="/logo.png" alt="AFI" className="h-30 w-60 self-center" />
                        <p className="font-lato text-sm leading-relaxed text-white/60">
                            The ultimate fan engagement platform for Golden State Warriors fans.
                            Live watch-parties, predictions, stats, and fan events — all in one place.
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            <span className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-primary">
                                Stay Golden. Stay Connected.
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">
                            Navigate
                        </p>
                        <ul className="grid grid-cols-2 gap-x-16 gap-y-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.to}>
                                    <button
                                        onClick={() => navigate(link.to)}
                                        className="font-lato text-sm text-white/70 hover:text-primary transition-colors duration-150 cursor-pointer text-left"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">
                            Legal
                        </p>
                        <ul className="flex flex-col gap-3">
                            {["Terms of Service", "Privacy Policy", "Contact Us"].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="font-lato text-sm text-white/70 hover:text-primary transition-colors duration-150"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 py-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="font-lato text-xs text-white/40">
                        © {year} AFI — Active Fan Interaction. All rights reserved.
                    </p>
                    <p className="font-lato text-xs text-white/40">
                        Built by Lumina Consulting
                    </p>
                </div>
            </div>
        </footer>
    );
}
