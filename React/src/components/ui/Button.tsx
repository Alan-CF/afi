interface ButtonProps {
    variant: "primary" | "secondary" | "destructive" | "success" | "gold";
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    disabled?: boolean;
}

export default function Button({ variant, children, onClick, className, disabled }: ButtonProps) {

    function getStyle() {
        switch (variant) {
            case "primary":
                return "text-text bg-primary border-transparent enabled:active:bg-primary-dark";
            case "secondary":
                return "text-secondary border-secondary enabled:active:bg-primary-dark enabled:active:text-text enabled:active:border-transparent enabled:hover:bg-primary enabled:hover:border-transparent enabled:hover:text-text";
            case "destructive":
                return "text-white bg-destructive border-transparent enabled:active:bg-destructive-dark";
            case "success":
                return "text-white bg-success border-transparent enabled:active:bg-success-dark";
            case "gold":
                return "font-anton text-white border-secondary bg-secondary enabled:hover:bg-primary enabled:hover:text-white enabled:hover:border-transparent enabled:active:bg-primary-dark";
            default:
                return "";
        }
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-2xl font-medium border-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getStyle()} ${className ?? ""}`}
        >
            {children}
        </button>
    );
}