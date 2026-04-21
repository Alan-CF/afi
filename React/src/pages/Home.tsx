import { FireIcon, TrophyIcon, StarIcon, ClockIcon, CalendarIcon, MapPinIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import { useHome } from "../hooks/useHome";
import type { Challenge } from "../hooks/useHome";

function Home() {
    const { profile, challenges, events, loading } = useHome();

    const streakDays = Array.from({ length: 4 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (3 - i));
        return {
            label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase(),
            filled: profile ? i >= 4 - (profile.streak > 4 ? 4 : profile.streak) : false,
        };
    });

    const placeholderChallenges: Challenge[] = Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        name: "Coming soon",
        points: 0,
        duration: "",
        image_url: null,
    }));

    const displayChallenges = challenges.length > 0 ? challenges : placeholderChallenges;

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="max-w-5xl mx-auto px-4 py-8">

                {loading && (
                    <p className="font-lato text-text-light text-center mt-10">Loading...</p>
                )}

                {!loading && (
                    <div className="flex flex-col md:flex-row gap-6">

                        <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">

                            <div>
                                <p className="font-lato text-text-light text-sm">Welcome back</p>
                                <h1 className="font-lato font-black text-2xl text-text">
                                    @{profile?.username ?? "fan"}
                                </h1>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm flex flex-col gap-1">
                                    <span className="font-lato text-xs text-text-light">My Points</span>
                                    <span className="font-lato font-black text-2xl text-primary">
                                        {profile?.points.toLocaleString() ?? "0"}
                                    </span>
                                    <span className="font-lato text-xs text-text-light">League ranking</span>
                                </div>
                                <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm flex flex-col gap-1">
                                    <span className="font-lato text-xs text-text-light">My Rank</span>
                                    <span className="font-lato font-black text-2xl text-secondary">
                                        #{profile?.rank ?? "—"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <StarIcon className="w-3 h-3 text-primary" />
                                        <span className="font-lato text-xs text-text-light">Top performer</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary rounded-2xl p-5 text-white">
                                <p className="font-lato font-black text-lg">Keep it up!</p>
                                <p className="font-lato text-sm text-surface-light mt-1">
                                    Continue the momentum with another game
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <FireIcon className="w-5 h-5 text-primary" />
                                        <span className="font-lato font-black text-lg text-text">Daily Streak</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className="font-lato font-black text-3xl text-secondary">
                                            {profile?.streak ?? 0}
                                        </span>
                                        <span className="font-lato text-xs text-text-light mb-1">DAYS</span>
                                    </div>
                                </div>
                                <p className="font-lato text-sm text-text-light mb-4">Keep going!</p>
                                <div className="flex justify-between">
                                    {streakDays.map((day, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <span className="font-lato text-xs text-text-light">{day.label}</span>
                                            <div className={`w-8 h-8 rounded-full ${day.filled ? "bg-secondary" : "border-2 border-gray-200"}`} />
                                        </div>
                                    ))}
                                </div>
                                <p className="font-lato text-sm text-text-light text-center mt-4">
                                    {profile?.streak ?? 0} days streak
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-6">

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-lato font-black text-xl text-text">Challenges</span>
                                    <span className="font-lato text-sm text-primary">See all</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {displayChallenges.map((c) => (
                                        <div key={c.id} className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm flex flex-col items-center gap-2">
                                            {c.image_url ? (
                                                <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <TrophyIcon className="w-12 h-12 text-primary" />
                                            )}
                                            <span className="font-lato font-black text-sm text-text text-center">{c.name}</span>
                                            {c.points > 0 && (
                                                <span className="font-lato font-black text-sm text-primary">{c.points} points</span>
                                            )}
                                            {c.duration ? (
                                                <div className="flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3 text-text-light" />
                                                    <span className="font-lato text-xs text-text-light">{c.duration}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="font-lato font-black text-xl text-text block mb-3">Upcoming Events</span>
                                {events.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {events.map((ev) => (
                                            <div key={ev.id} className="bg-white rounded-2xl overflow-hidden border-2 border-gray-100 shadow-sm flex flex-row items-center">
                                                {ev.image_url ? (
                                                    <img src={ev.image_url} alt={ev.name} className="w-20 h-20 object-cover shrink-0" />
                                                ) : (
                                                    <div className="bg-secondary w-20 h-20 flex items-center justify-center shrink-0">
                                                        <CalendarIcon className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                                <div className="p-4 flex flex-col gap-1 min-w-0">
                                                    <span className="font-lato font-black text-sm text-text truncate">{ev.name}</span>
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3 text-primary shrink-0" />
                                                        <span className="font-lato text-xs text-text-light">
                                                            {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} | {new Date(ev.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPinIcon className="w-3 h-3 text-primary shrink-0" />
                                                        <span className="font-lato text-xs text-text-light truncate">{ev.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-secondary rounded-2xl p-5 text-white text-center">
                                        <p className="font-lato text-sm text-surface-light">No upcoming events right now.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Home;
