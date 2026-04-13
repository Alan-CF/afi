import { UserCircleIcon, TrophyIcon, FireIcon, BoltIcon } from "@heroicons/react/24/solid";
import NavBar from "../components/layout/NavBar";
import { useLeaderboard } from "../hooks/useRanking";

function Ranking() {
    const { leaderboard, myRank, loading, error } = useLeaderboard();

    return (
        <>
            <NavBar />
            <div className="min-h-screen bg-gray-50 px-4 py-8">

                <div className="flex flex-col items-center gap-4 mb-7">
                    <TrophyIcon className="w-24 h-24 text-primary" />
                    <h1 className="font-lato font-black text-4xl text-text text-center">
                        Leaderboard
                    </h1>
                    <p className="font-lato font-black text-1xl text-text text-center">
                        Top Fans of the Month
                    </p>
                </div>

                {loading && (
                    <p className="font-lato text-text-light text-center mt-10">Loading leaderboard...</p>
                )}

                {error && !loading && (
                    <p className="font-lato text-destructive text-center mt-10">
                        Could not load the leaderboard. Please try again.
                    </p>
                )}

                {!loading && !error && (
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">

                        <div className="flex-1 flex flex-col gap-3 order-1 md:order-2">
                            {leaderboard.map((entry) => (
                                <LeaderboardRow
                                    key={entry.profile_id}
                                    rank={entry.rank}
                                    username={entry.username}
                                    points={entry.points}
                                    avatar_url={entry.avatar_url}
                                    isCurrentUser={myRank?.profile_id === entry.profile_id}
                                />
                            ))}
                        </div>

                        <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 order-2 md:order-1">
                            {myRank ? (
                                <>
                                    <div className="bg-secondary rounded-2xl p-6 text-white flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 shrink-0">
                                                {myRank.avatar_url ? (
                                                    <img
                                                        src={myRank.avatar_url}
                                                        alt="your avatar"
                                                        className="w-14 h-14 rounded-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                    />
                                                ) : (
                                                    <UserCircleIcon className="w-14 h-14 text-white" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="font-lato text-sm text-surface-light">Your standing</p>
                                                <p className="font-lato font-black text-2xl">Rank #{myRank.rank}</p>
                                                <span className="font-lato font-black text-xs bg-primary text-text rounded-full px-2 py-0.5 self-start">YOU</span>
                                            </div>
                                        </div>
                                        <div className="border-t border-surface-dark pt-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="font-lato text-sm text-surface-light">Your Points</span>
                                                <span className="font-lato font-black text-xl text-primary">{myRank.points.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-lato text-sm text-surface-light">Points to #1</span>
                                                <span className="font-lato font-black text-xl text-white">{myRank.pointsToFirst.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <BoltIcon className="w-5 h-5 text-primary" />
                                            <span className="font-lato font-black text-lg text-text">Current Streak</span>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="font-lato font-black text-4xl text-secondary">{myRank.streak}</span>
                                            <span className="font-lato text-md text-text mb-1">days in a row</span>
                                        </div>
                                        <p className="font-lato text-sm text-text">
                                            {myRank.streak >= 7
                                                ? "You are on fire! Keep it up!"
                                                : myRank.streak >= 3
                                                ? "Good momentum — don't break the streak!"
                                                : "Play daily to build your streak."}
                                        </p>
                                    </div>

                                    <div className="bg-secondary rounded-2xl p-5 text-white flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FireIcon className="w-5 h-5 text-primary" />
                                            <span className="font-lato font-black text-lg text-white">Keep earning!</span>
                                        </div>
                                        <p className="font-lato text-sm text-surface-light mb-3">
                                            Play more games to climb the leaderboard.
                                        </p>
                                        <button className="bg-primary text-text font-lato font-black rounded-xl px-4 py-2 w-full">
                                            Play Now
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-secondary rounded-2xl p-6 text-white text-center">
                                    <UserCircleIcon className="w-14 h-14 text-surface-light mx-auto mb-3" />
                                    <p className="font-lato font-black text-xl mb-1">See your rank</p>
                                    <p className="font-lato text-sm text-surface-light">
                                        Log in to see where you stand among the top fans.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </>
    );
}

export default Ranking;

interface LeaderboardRowProps {
    rank: number;
    username: string;
    points: number;
    avatar_url: string | null;
    isCurrentUser: boolean;
}

function LeaderboardRow({ rank, username, points, avatar_url, isCurrentUser }: LeaderboardRowProps) {
    const isFirst = rank === 1;

    return (
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 bg-white shadow-md ${
            isFirst ? "border-2 border-primary" : isCurrentUser ? "border-2 border-secondary" : "border-2 border-gray-100"
        }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isFirst ? "bg-primary" : "bg-secondary"}`}>
                <span className={`font-lato font-black text-sm ${isFirst ? "text-text" : "text-white"}`}>{rank}</span>
            </div>

            <div className="flex items-center gap-3 flex-1 px-3 min-w-0">
                <div className="w-9 h-9 shrink-0">
                    {avatar_url ? (
                        <img
                            src={avatar_url}
                            alt={username}
                            className="w-9 h-9 rounded-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                    ) : (
                        <UserCircleIcon className="w-9 h-9 text-text-light" />
                    )}
                </div>
                <span className="font-lato text-sm font-semibold min-w-0 truncate text-text">{username}</span>
            </div>

            <div className={`min-w-[4rem] h-9 rounded-lg flex items-center justify-center shrink-0 px-3 ${isFirst ? "bg-primary" : "bg-secondary"}`}>
                <span className={`font-lato font-black text-sm ${isFirst ? "text-text" : "text-white"}`}>{points.toLocaleString()}</span>
            </div>
        </div>
    );
}
