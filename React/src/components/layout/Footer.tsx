export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
        <p className="font-lato text-xs uppercase tracking-[0.16em] text-text-light">
          AFI — Stay Golden, Stay Connected · © {year} Lumina Consulting
        </p>
        <nav aria-label="Legal">
          <ul className="flex gap-4 font-lato text-xs text-text-light">
            <li><a href="#" className="hover:text-secondary">Terms</a></li>
            <li><a href="#" className="hover:text-secondary">Privacy</a></li>
            <li><a href="#" className="hover:text-secondary">Contact</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
