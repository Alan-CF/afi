export default function ShopHero() {
  

  return (
    <section>
      <div className="relative min-h-[28rem] overflow-hidden bg-secondary shadow-lg md:min-h-[34rem]">
        <img
          src="/shop_banner.jfif"
          alt="Shop banner"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/45 to-transparent" />

        <div className="relative z-10 flex min-h-[28rem] max-w-xs md:max-w-3xl flex-col justify-end gap-3 px-6 py-8 text-white md:min-h-[34rem] md:px-10 md:py-12">
            <h1 className="font-anton text-5xl leading-none md:text-7xl">
              Wear the game beyond the court
            </h1>
            <p className="max-w-2xl font-lato text-lg text-white/90 md:text-2xl">
              Discover exclusive collections, player drops, and everyday gear
              built for fans who want more than just merch.
            </p>

        </div>
      </div>
    </section>
  );
}
