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
      className="flex h-full flex-col overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-sm"
    >
      <div className="relative h-40 bg-secondary">
        {featured?.image_url ? (
          <img
            src={featured.image_url}
            alt=""
            className="h-full w-full object-cover opacity-80"
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-secondary to-primary"
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="absolute left-4 top-4 font-lato text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Featured quiz
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {loading ? (
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
        ) : (
          <h2 className="font-anton text-2xl text-secondary">
            {featured?.title ?? "No quiz available"}
          </h2>
        )}

        {featured && (
          <p className="font-lato text-sm text-text-light">
            {featured.question_count ?? 0} questions · 1× per week
          </p>
        )}

        <Button
          variant="primary"
          className="mt-auto"
          onClick={() => navigate("/quizzes")}
          disabled={!featured}
        >
          {featured ? "Start Quiz" : "Coming soon"}
        </Button>
      </div>
    </section>
  );
}
