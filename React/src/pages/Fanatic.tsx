import { useState } from "react";
import Countdown, { type CountdownRenderProps } from "react-countdown";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import CarouselCard from "../components/ui/CarouselCard";
import Dialog from "../components/ui/Dialog";
import { 
    useFanaticGame, 
    useFanaticRiddles,
    useSubmitFanaticAnswer, 
    useFanaticTries, 
    useFanaticBestTry,
    useFanaticNextRiddleDate
} from "../hooks/useFanatic";
import { useProfile } from "../hooks/useProfile";

function isFutureDate(date?: Date | null) {
    return !!date && date.getTime() > Date.now();
}

function formatTime(
    { minutes, seconds, total }: CountdownRenderProps,
) {
    const totalHours = Math.floor(total / (1000 * 60 * 60));

    if (totalHours >= 24) {
        const totalDays = Math.floor(totalHours / 24);
        const remainingHours = totalHours % 24;

        return [totalDays, remainingHours, minutes, seconds]
            .map((value) => value.toString().padStart(2, "0"))
            .join(":");
    }

    return [totalHours, minutes, seconds]
        .map((value) => value.toString().padStart(2, "0"))
        .join(":");
}

function Fanatic() {

    const { 
        user, 
        loading: profileLoading, 
    } = useProfile();
    const {
        status: gameStatus,
        nextGameDate,
        loading: gameLoading,
        error: gameError,
    } = useFanaticGame();

    const hasAuthenticatedUser = user !== null;
    const hasActiveGame = gameStatus === "active";
    const {
        riddles,
        category,
        loading: riddlesLoading,
        error: riddlesError,
    } = useFanaticRiddles({ enabled: hasActiveGame });
    const { answer, loading: submitting, error: submitError } = useSubmitFanaticAnswer();
    const {
        triesInfo,
        loading: triesLoading,
        error: triesError,
        refreshTriesInfo,
    } = useFanaticTries({ enabled: hasActiveGame && hasAuthenticatedUser });
    const {
        bestTry,
        loading: bestTryLoading,
        error: bestTryError,
        refreshBestTry,
    } = useFanaticBestTry({ enabled: hasActiveGame && hasAuthenticatedUser });
    const {
        nextRiddleDate,
        loading: nextRiddleLoading,
        error: nextRiddleError,
    } = useFanaticNextRiddleDate({ enabled: hasActiveGame });

    const [guess, setGuess] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);

    const handleGuess = async () => {
        if (!guess.trim()) return;
        const result = await answer(guess);
        setSubmitResult(result);
        setDialogOpen(true);
        refreshTriesInfo();
        refreshBestTry();
    };
    
    if (profileLoading || gameLoading || (hasActiveGame && (riddlesLoading || triesLoading || bestTryLoading || nextRiddleLoading))) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl font-anton animate-pulse">Loading...</p>
            </div>
        );
    }

    if (gameStatus === "no-game" && nextGameDate) {
        return (
            <div className="flex items-center justify-center min-h-screen p-6">
                <p className="text-xl text-black font-anton text-center">
                    <Countdown
                        key={nextGameDate.toISOString()}
                        date={nextGameDate}
                        intervalDelay={0}
                        precision={0}
                        renderer={(props) =>
                            props.completed ? null : <>Next game in: {formatTime(props)}</>
                        }
                    />
                </p>
            </div>
        );
    }

    if (gameError || riddlesError || triesError || bestTryError || nextRiddleError) {
        return (
            <div className="flex items-center justify-center min-h-screen p-6">
                <p className="text-xl text-red-500 font-anton text-center">
                    Oops! Something went wrong fetching the data.
                </p>
            </div>
        );
    }

    const carouselItems = riddles
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(r => r.riddle);
        
    const hasNextTryDate = isFutureDate(triesInfo?.next_try_date);
    const isOutOfTries = triesInfo?.remaining_tries_game === 0 || triesInfo?.remaining_tries_today === 0;

    return (
        <>
        {/* Header section with Tries Info */}
            <div className="w-full flex justify-between items-center px-10 py-4">
                <div className="flex items-center gap-3">
                    <span className="font-anton text-5xl text-primary">{bestTry?.highest_similarity ?? 0}%</span>
                    <span className="font-lato text-sm text-black">Best<br />Try</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-anton text-5xl text-primary">{triesInfo?.remaining_tries_game ?? 0}</span>
                    <span className="font-lato text-sm text-black">Attempts<br />Remaining</span>
                </div>
            </div>
        <div className="flex flex-col gap-4 min-h-screen p-6 max-w-2xl mx-auto items-center">
            {/* Carousel */}
            
            {category && (
                <p className="font-anton text-5xl text-black">
                    {category.toUpperCase()}?
                </p>
            )}
            <CarouselCard items={carouselItems.length > 0 ? carouselItems : ["No clues available."]} />
            
            <p className="font-lato text-lg font-semibold text-black">
                {isFutureDate(nextRiddleDate) && (
                    <Countdown
                        key={nextRiddleDate!.toISOString()}
                        date={nextRiddleDate!}
                        intervalDelay={0}
                        precision={0}
                        renderer={(props) =>
                            props.completed ? null : <>Next riddle in: {formatTime(props)}</>
                        }
                    />
                )}
            </p>
            

            {/* Guess Section */}
            <div className="w-full flex flex-col gap-4 pb-4">
                <Input 
                    placeholder="Your guess here!"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                />

                <Button 
                    variant="secondary"
                    className="font-anton text-2xl py-3"
                    onClick={handleGuess}
                    disabled={submitting || hasNextTryDate || isOutOfTries || !hasAuthenticatedUser}
                >
                    {!hasAuthenticatedUser ? "Login to Guess" : hasNextTryDate ? (
                        <Countdown
                            key={triesInfo!.next_try_date!.toISOString()}
                            date={triesInfo!.next_try_date!}
                            intervalDelay={0}
                            precision={0}
                            onComplete={refreshTriesInfo}
                            renderer={(props) =>
                                props.completed ? "Guess!" : <>Next try in: {formatTime(props)}</>
                            }
                        />
                    ) : isOutOfTries ? "No Tries Left" : submitting ? "Submitting..." : "Guess!"}
                </Button>
            </div>

            {/* Result Dialog */}
            <Dialog isOpen={dialogOpen}>
                <div className="flex flex-col gap-4 text-center items-center">
                    <h2 className={`text-3xl font-anton ${submitError ? 'text-red-500' : submitResult?.correct ? 'text-green-500' : 'text-primary'}`}>
                        {submitError ? "Error" : submitResult?.message || "Result"}
                    </h2>
                    <p className="font-lato text-lg">
                        {submitError 
                            ? submitError.message 
                            : submitResult 
                                ? JSON.stringify(submitResult) 
                                : "No result"}
                    </p>
                    <Button 
                        variant="primary" 
                        onClick={() => setDialogOpen(false)}
                        className="w-full mt-2"
                    >
                        Close
                    </Button>
                </div>
            </Dialog>
        </div>
        </>
    );
}

export default Fanatic;
