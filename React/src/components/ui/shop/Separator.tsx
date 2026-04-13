type ShopSeparatorProps = {
  message: string;
};

export default function ShopSeparator({ message }: ShopSeparatorProps) {
  return (
    <section>
      <div className="relative overflow-hidden bg-secondary px-6 py-10 text-center text-white shadow-lg md:px-10">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-primary/90" />
        <div className="absolute left-0 bottom-0 h-1.5 w-full bg-primary/90" />



        <p className="relative mt-4 font-anton text-3xl uppercase leading-tight tracking-wide md:mt-5 md:text-4xl">
          {message}
        </p>
        <p className="relative mt-3 font-lato text-sm text-white/80 md:text-base">
          Jerseys, lifestyle pieces, and standout drops built to go beyond game day.
        </p>
      </div>
    </section>
  );
}
