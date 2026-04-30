import { signInWithGoogle } from "../lib/auth";
import ArrowLeftIcon from "@heroicons/react/24/solid/esm/ArrowLeftIcon";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen overflow-hidden bg-text-light-soft font-[family-name:var(--font-lato)]">
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="Go back"
        className="absolute top-6 left-6 z-20 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary md:bg-white/10 text-white backdrop-blur-sm border border-white/20 transition hover:bg-secondary/80 md:hover:bg-white/20"
      >
        <ArrowLeftIcon className="h-5 w-5" />
      </button>

      {/* logo afi movil */}
      <img
        src="/logo_blue.png"
        alt="App Logo"
        className="absolute top-6 right-6 z-20 h-10 w-auto md:hidden"
      />
      <main className="grid h-[calc(100vh-64px)] grid-cols-1 md:grid-cols-2">
        
        {/* logo warriors desktop */}
        <div className="relative hidden md:block h-full bg-secondary">
          <img
            src="/login_foto.png"
            alt="Golden State Warriors"
            className="h-full w-full object-contain object-center scale-90"
          />
        </div>

        {/* login */}
        <div className="flex h-full items-center justify-center px-6 md:px-10">
          <div className="w-full max-w-md flex flex-col items-center text-center">
            
            {/* logo warriors movil */}
            <img
              src="https://upload.wikimedia.org/wikipedia/en/0/01/Golden_State_Warriors_logo.svg"
              alt="Warriors"
              className="h-28 w-28 mb-6 md:hidden"
            />
            {/* logo afi desktop */}
            <img
              src="/logo_blue.png"
              alt="App Logo"
              className="hidden md:block mb-8 h-12 w-auto opacity-90"
            />
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-secondary/70">
                Fan Access
              </p>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-secondary">
                Login
              </h2>
              <p className="mt-3 text-base font-semibold leading-7 text-black/80">
                Sign in with Google to access your Warriors experience.
              </p>
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-secondary px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-secondary/90"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-extrabold text-secondary">
                G
              </span>
              Continue with Google
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}