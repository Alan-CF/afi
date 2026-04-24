import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export default function CTABanner() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label="Join the Dub Nation"
        className="relative overflow-hidden rounded-3xl aspect-[21/9] bg-primary flex items-end"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 20%, #ffffff 0%, transparent 60%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col gap-4 max-w-lg">
          <h2 className="font-anton text-5xl md:text-6xl text-secondary lowercase leading-none">
            join<br />the dub<br />nation
          </h2>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Sign up free →
          </Button>
        </div>
      </section>

      <p className="text-center font-lato text-sm text-text-light">
        Already a member?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-secondary font-bold hover:text-primary transition-colors"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
