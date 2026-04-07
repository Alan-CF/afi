import NavBar from "../components/layout/NavBar";
import { useProfile } from "../hooks/useProfile";

export default function MyProfile() {
  const { user } = useProfile();
  const handle = user?.username ?? "cesart";
  const name = handle === "cesart" ? "Cesar Treviño" : handle;

  return (

    <div className="min-h-screen bg-[var(--color-text-light-soft)] text-text">
      <NavBar />

      <main className="mx-auto max-w-lg px-4 pb-10 pt-6">

        {/* Info general */}
        <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 mb-6">

          {/* Avatar y nombre */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex h-24 w-24 items-center justify-center border-4 border-white rounded-full bg-[#1d3a6e] shadow-lg mb-3">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="white" className="h-12 w-12">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-500">@{handle}</p>
          </div>

          {/* Metricas */}
          <div className="grid grid-cols-3 gap-3">

            <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d3a6e]">
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">5</p>
              <p className="text-xs text-gray-500">Streak</p>
            </div>

            <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8932a]">
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">25</p>
              <p className="text-xs text-gray-500">Points</p>
            </div>

            <div className="flex flex-col items-center rounded-xl bg-gray-50 p-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#b8932a]">
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">⚡</p>
              <p className="text-xs text-gray-500">League</p>
            </div>

          </div>
        </section>

        {/* About me */}
        <section className="rounded-2xl mb-6">
            <h2 className="text-xs font-inter font-bold uppercase tracking-widest text-gray-700 mb-3">About me</h2>
            <section className="rounded-2xl border-2 border-gray-200 bg-white p-3 mb-4">
            <div className="rounded-xl font-inter bg-gray-50 px-4 py-3 text-sm text-gray-600">
                25 year old Mexican basketball fan
            </div>
            </section>
        </section>
        {/* Logros */}

        <section className="rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-inter font-bold uppercase tracking-widest text-gray-700">Achievements</h2>
                <button className="text-xs font-inter font-semibold text-[#b8932a]">View All</button>
            </div>
            <section className="rounded-2xl border-2 border-gray-200 bg-white p-5 mb-4">
            <div className="grid grid-cols-4 gap-8">
                {[
                {
                    icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-[#b8932a]">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    ),
                },
                {
                    icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-[#b8932a]">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    ),
                },
                {
                    icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6 text-[#b8932a]">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    ),
                },
                {
                    icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-[#b8932a]">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    ),
                },
                ].map((item, i) => (
                <div
                    key={i}
                    className="flex items-center justify-center rounded-2xl border-2 border-[#b8932a] bg-white py-5"
                >
                    {item.icon}
                </div>
                ))}
            </div>
            </section>
        </section>

        {/* Historial de puntos */}
        <section className="rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-inter font-bold uppercase tracking-widest text-gray-700">Points History</h2>
                <button className="text-xs font-inter font-semibold text-[#b8932a]">See All</button>
            </div>
            <section className="rounded-2xl border-2 border-gray-200 bg-white p-5">

            <div className="space-y-3 font-inter">
                {[
                {
                    title: "Daily login",
                    subtitle: "Welcome back to AFI · 2/27/2026",
                    points: "+10",
                    icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                    </svg>
                    ),
                },
                {
                    title: "Challenge completed",
                    subtitle: "3-Point Contest Winner · 2/26/2026",
                    points: "+15",
                    icon: (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
                        <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
                    </svg>
                    ),
                },
                ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200">
                    {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="font-inter font-semibold text-sm text-gray-900">{item.title}</p>
                    <p className="font-inter text-xs text-gray-400">{item.subtitle}</p>
                    </div>
                    <p className="text-base font-inter font-bold text-[#b8932a]">{item.points}</p>
                </div>
                ))}
            </div>
            </section>
        </section>

      </main>
    </div>
  );
}