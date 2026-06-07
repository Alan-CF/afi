import { useNavigate } from 'react-router-dom';
import ScoreboardRibbon from '../components/layout/ScoreboardRibbon';

interface GameCardConfig {
  to: string;
  kicker: string;
  title: string;
  desc: string;
  cta: string;
  imageUrl: string;
  objectPosition: string;
}

const GAMES: GameCardConfig[] = [
  {
    to: '/fanatic',
    kicker: 'Daily Challenge',
    title: 'Fanatic',
    desc: 'Guess today’s Warrior from a few clues. A new challenge drops every game day.',
    cta: 'Play Fanatic',
    imageUrl:
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    objectPosition: 'center',
  },
  {
    to: '/shoot-your-shot',
    kicker: 'Arcade Game',
    title: 'Shoot Your Shot',
    desc: 'Sink as many shots as possible before time runs out and compete for the top spot on the leaderboard.',
    cta: 'Take the shot',
    imageUrl: '/court_warriors.png',
    objectPosition: 'center',
  },
  {
    to: '/quizzes',
    kicker: 'Trivia',
    title: 'Quizzes',
    desc: 'Quick Warriors trivia rounds. Test your knowledge, climb the leaderboard.',
    cta: 'Start a quiz',
    imageUrl: '/basketball-texture.webp',
    objectPosition: 'center',
  },
];

function GameCard({ game, stagger }: { game: GameCardConfig; stagger: number }) {
  const navigate = useNavigate();
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl bg-secondary flex flex-col justify-end min-h-[280px] md:min-h-[320px] lg:min-h-[360px] fade-in-up stagger-${stagger}`}
    >
      <img
        src={game.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ objectPosition: game.objectPosition }}
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      <span
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-[18%] font-anton text-primary opacity-[0.08] select-none leading-none"
        style={{ fontSize: 'clamp(7rem, 18vw, 14rem)' }}
        aria-hidden
      >
        W
      </span>

      <div className="relative z-10 p-6 md:p-7 flex flex-col gap-3">
        <p className="font-lato text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
          {game.kicker}
        </p>
        <h2 className="font-anton text-2xl md:text-3xl text-white leading-tight">
          {game.title}
        </h2>
        <p className="font-lato text-sm text-white/75">{game.desc}</p>
        <div className="mt-1">
          <button
            type="button"
            onClick={() => navigate(game.to)}
            className="rounded-2xl bg-primary px-5 py-3 font-lato text-sm font-bold text-secondary hover:bg-primary-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {game.cta}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Games() {
  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <ScoreboardRibbon />
      <main className="w-full flex-1 px-4 sm:px-8 pt-4 md:pt-6 pb-16 md:pb-20">
        <header className="mb-6 md:mb-8 fade-in-up stagger-1">
          <h1 className="font-anton text-3xl md:text-4xl text-secondary leading-tight">
            Games
          </h1>
          <p className="mt-2 font-lato text-sm md:text-base text-text-light">
            Daily challenges, arcade basketball game, and trivia.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {GAMES.map((game, i) => (
            <GameCard key={game.to} game={game} stagger={i + 2} />
          ))}
        </div>
      </main>
    </div>
  );
}
