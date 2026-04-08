import React, { useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface CarouselCardProps {
    items: React.ReactNode[];
    className?: string;
}

function CarouselCard({ items, className }: CarouselCardProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            if (index !== activeIndex) {
                setActiveIndex(index);
            }
        }
    };

    const scroll = (offset: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth * offset, behavior: 'smooth' });
        }
    };

    return (
        <div className={`group relative flex w-full flex-col items-center justify-between overflow-hidden rounded-[2rem] border-4 border-secondary p-6 md:p-10 ${className ?? ""}`}>
            <button 
                onClick={() => scroll(-1)} 
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 p-2 text-secondary opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100 md:left-2"
                disabled={activeIndex === 0}
            >
                <ChevronLeftIcon className="h-8 w-8 md:h-10 md:w-10" />
            </button>
            <button 
                onClick={() => scroll(1)} 
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 p-2 text-secondary opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100 md:right-2"
                disabled={activeIndex === items.length - 1}
            >
                <ChevronRightIcon className="h-8 w-8 md:h-10 md:w-10" />
            </button>

            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="no-scrollbar mb-6 flex w-full snap-x snap-mandatory scroll-smooth overflow-x-auto md:mb-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => (
                    <div 
                        key={index} 
                        className="flex w-full shrink-0 snap-center snap-always items-center justify-center px-4 text-center min-h-[250px] md:px-10"
                    >
                        <div className="max-w-lg select-none font-lato text-xl leading-snug text-text md:text-2xl">
                            {item}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Dots */}
            <div className="flex items-center justify-center gap-2">
                {items.map((_, index) => (
                    <div
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                            index === activeIndex 
                                ? 'scale-125 bg-secondary' 
                                : 'bg-[#D9D9D9]'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarouselCard;
