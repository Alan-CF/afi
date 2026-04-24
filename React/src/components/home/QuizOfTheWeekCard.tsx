import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useQuizzes } from "../../hooks/useQuizzes";

export default function QuizOfTheWeekCard() {
  const navigate = useNavigate();
  const { quizzes, loading } = useQuizzes();
  const featured = quizzes.find((q: any) => q.status === "available") ?? quizzes[0] ?? null;

  return (
    <section
      aria-label="Quiz of the week"
      className="relative overflow-hidden rounded-3xl aspect-[21/9] flex items-end bg-secondary"
    >
      {featured?.image_url ? (
        <img
          src={featured.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 30% 50%, #2a1a4e 0%, #0d1f3c 100%)",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
        <h2 className="font-anton text-5xl md:text-6xl text-white lowercase leading-none">
          {loading ? "quiz of\nthe week" : (featured?.title ?? "quiz of\nthe week")}
        </h2>
        <Button
          variant="primary"
          onClick={() => navigate("/quizzes")}
          disabled={!featured}
        >
          {featured ? "Start quiz →" : "Coming soon"}
        </Button>
      </div>
    </section>
  );
}
