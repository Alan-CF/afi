import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useQuizzes } from "../../hooks/useQuizzes";

export default function QuizOfTheWeekCard() {
  const navigate = useNavigate();
  const { quizzes, loading } = useQuizzes();

  const featured =
    quizzes.find((q: any) => q.status === "available") ?? quizzes[0] ?? null;

  return (
    <section
      aria-label="Quiz of the Week"
      className="relative overflow-hidden rounded-3xl min-h-[320px] flex flex-col justify-end"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-secondary" />

      {featured?.image_url && (
        <img
          src={featured.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 90%, #FFC72C 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4 p-7">
        <span className="font-lato text-xs font-black uppercase tracking-[0.2em] text-primary self-start">
          Featured Quiz
        </span>

        <h2 className="font-anton text-4xl text-white uppercase leading-tight">
          {loading ? (
            <span className="block h-10 w-48 animate-pulse rounded bg-white/20" />
          ) : (
            featured?.title ?? "Quiz of the Week"
          )}
        </h2>

        {featured && (
          <p className="font-lato text-sm text-white/60">
            {featured.question_count ?? 0} questions · 1× per week
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="font-lato text-xs text-white/40 uppercase tracking-wider">
            Test your knowledge
          </span>
          <Button
            variant="primary"
            onClick={() => navigate("/quizzes")}
            disabled={!featured}
          >
            {featured ? "Start Quiz" : "Coming soon"}
          </Button>
        </div>
      </div>
    </section>
  );
}
