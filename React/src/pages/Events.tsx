import NavBar from "../components/layout/NavBar";
import Footer from "../components/layout/Footer";

export default function Events() {
  return (
    <div className="flex min-h-screen flex-col bg-text-light-soft">
      <NavBar />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6">
        <h1 className="font-anton text-4xl text-secondary">Events</h1>
        <p className="mt-2 font-lato text-text-light">Coming in the next step.</p>
      </main>
      <Footer />
    </div>
  );
}
