import { useNavigate } from "react-router-dom";
import { useHome } from "../../hooks/useHome";
import Button from "../ui/Button";

export default function GreetingStrip() {
  const { greeting, loading } = useHome();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-between rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const username = greeting?.username ?? "fan";

  return (
    <section
      aria-label="Greeting"
      className="flex items-center justify-between gap-4 rounded-2xl border-2 border-gray-100 bg-white px-4 py-3 shadow-sm"
    >
      <div>
        <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">
          Welcome back
        </p>
        <h1 className="font-anton text-2xl text-secondary">@{username}</h1>
      </div>
      <Button variant="secondary" onClick={() => navigate("/myprofile")}>
        See Profile
      </Button>
    </section>
  );
}
