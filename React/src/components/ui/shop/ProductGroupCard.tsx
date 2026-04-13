interface ProductGroupCardProps {
    title: string;
    description?: string;
    imageUrl: string;
    onClick: () => void;
}

export function ProductGroupCard({ title, description, imageUrl, onClick }: ProductGroupCardProps) {
    return (
      <button onClick={onClick} className="flex shrink-0 cursor-pointer flex-col justify-between p-4 text-start">
        <img
          src={imageUrl}
          alt={title}
          className="mb-4 h-90 md:h-120 w-52 md:w-72 max-w-full rounded object-cover"
        />
        <div className="flex flex-col">
          <h3 className="text-2xl md:text-3xl font-anton font-semibold">{title}</h3>
          <p className="text-md md:text-lg font-lato">{description}</p>
        </div>
      </button>
    );
}
