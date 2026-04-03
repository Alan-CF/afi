interface DialogProps {
    isOpen: boolean;
    children: React.ReactNode;
    className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

const Dialog = ({ isOpen, children, className }: DialogProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className={`bg-white border-4 border-secondary rounded-[2rem] rounded-2xl p-6 w-full shadow-2xl ${className ?? ""}`}>
                {children}
            </div>
        </div>
    );
};

export default Dialog;
