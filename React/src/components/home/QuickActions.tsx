import { useNavigate } from "react-router-dom";
import { UserGroupIcon, BoltIcon, LinkIcon } from "@heroicons/react/24/solid";

interface Action {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

export default function QuickActions() {
  const navigate = useNavigate();

  const actions: Action[] = [
    {
      icon: <UserGroupIcon className="h-6 w-6" />,
      title: "Join Room",
      subtitle: "Enter a live watch-party",
      onClick: () => navigate("/rooms"),
    },
    {
      icon: <BoltIcon className="h-6 w-6" />,
      title: "Predict",
      subtitle: "Make your picks",
      onClick: () => navigate("/rooms"),
    },
    {
      icon: <LinkIcon className="h-6 w-6" />,
      title: "Watch Party Invite",
      subtitle: "Copy a shareable link",
      onClick: () => {
        const url = `${window.location.origin}/rooms`;
        void navigator.clipboard.writeText(url).catch(() => {
        });
      },
    },
  ];

  return (
    <section aria-label="Quick actions" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action.title}
          type="button"
          onClick={action.onClick}
          className="flex flex-col items-start gap-2 rounded-2xl border-2 border-gray-100 bg-white p-4 text-left shadow-sm transition-colors hover:border-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary">
            {action.icon}
          </span>
          <span className="font-lato font-black text-base text-text">{action.title}</span>
          <span className="font-lato text-sm text-text-light">{action.subtitle}</span>
        </button>
      ))}
    </section>
  );
}
