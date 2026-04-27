import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import BayBridgeSilhouette from "../common/BayBridgeSilhouette";

const NAV_GROUPS = [
    {
        label: "Fan Hub",
        links: [
            { label: "Home",        to: "/" },
            { label: "News",        to: "/news" },
            { label: "Events",      to: "/events" },
            { label: "Fanatic",     to: "/fanatic" },
            { label: "Rooms",       to: "/rooms" },
        ],
    },
    {
        label: "Warriors",
        links: [
            { label: "Stats",       to: "/stats" },
            { label: "Legacy",      to: "/legacy" },
            { label: "Leaderboard", to: "/ranking" },
            { label: "Shop",        to: "/shop" },
        ],
    },
    {
        label: "Account",
        links: [
            { label: "Profile",     to: "/myprofile" },
        ],
    },
];

const LEGAL = ["Terms of Service", "Privacy Policy", "Contact Us"];

function AccordionGroup({ label, links }: { label: string; links: { label: string; to: string }[] }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-white/10">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between py-4 px-0 font-lato text-xs font-bold uppercase tracking-[0.2em] text-white/40"
            >
                {label}
                <ChevronDownIcon className={`h-4 w-4 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-64 pb-4" : "max-h-0"}`}>
                <ul className="flex flex-col gap-3">
                    {links.map((link) => (
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
        </div>
    );
}

export default function Footer() {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <footer className="relative bg-secondary text-white overflow-hidden">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 opacity-[0.06]">
                <BayBridgeSilhouette />
            </div>

            <div className="relative mx-auto max-w-[1280px] px-4 md:px-6 lg:px-8">

                <div className="hidden md:grid md:grid-cols-4 gap-12 py-16">
                    <div className="flex flex-col gap-6">
                        <img src="/logo.png" alt="AFI" className="h-24 w-48 object-contain" />
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

                    {NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">
                                {group.label}
                            </p>
                            <ul className="flex flex-col gap-3">
                                {group.links.map((link) => (
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
                    ))}
                </div>

                <div className="md:hidden py-10">
                    <div className="flex flex-col gap-4 mb-8">
                        <img src="/logo.png" alt="AFI" className="h-20 w-40 object-contain self-start" />
                        <p className="font-lato text-sm leading-relaxed text-white/60">
                            The ultimate fan engagement platform for Golden State Warriors fans.
                        </p>
                    </div>

                    {NAV_GROUPS.map((group) => (
                        <AccordionGroup key={group.label} label={group.label} links={group.links} />
                    ))}

                    <div className="border-b border-white/10">
                        <AccordionGroup
                            label="Legal"
                            links={LEGAL.map((l) => ({ label: l, to: "#" }))}
                        />
                    </div>
                </div>

                <div className="hidden md:flex items-start gap-8 pb-10">
                    <p className="font-lato text-xs font-bold uppercase tracking-[0.2em] text-white/40 shrink-0 mt-0.5">Legal</p>
                    <ul className="flex flex-wrap gap-x-8 gap-y-2">
                        {LEGAL.map((item) => (
                            <li key={item}>
                                <a href="#" className="font-lato text-sm text-white/70 hover:text-primary transition-colors duration-150">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
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
