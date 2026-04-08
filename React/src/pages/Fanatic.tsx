import { useState } from "react";
import Countdown, { type CountdownRenderProps } from "react-countdown";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import CarouselCard from "../components/ui/CarouselCard";
import Dialog from "../components/ui/Dialog";
import type { FanaticAnswer } from "../lib/fanaticApi";
import {
    useFanaticGame, 
    useFanaticRiddles,
    useSubmitFanaticAnswer, 
    useFanaticTries, 
    useFanaticBestTry,
    useFanaticNextRiddleDate
} from "../hooks/useFanatic";
import { useProfile } from "../hooks/useProfile";
import NavBar from "../components/layout/NavBar";

function isFutureDate(date?: Date | null) {
    return !!date && date.getTime() > Date.now();
}

function handleSimilarityText(similarity: number | null) {
    let messages: string[] = [];

    if (similarity === null) {
        messages = [
            "Ref called timeout",
            "Technical foul",
            "Ball went out of bounds",
            "Foul on the play",
            "The ref blew the whistle"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    if (similarity >= 0.8) {
         messages = [
            "Swish! Nothing but net!",
            "Buckets!",
            "And one!",
            "That's a buzzer beater!",
            "MVP! MVP! MVP!",
        ];
    } else if (similarity >= 0.6) {
        messages = [
            "You're in the paint!",
            "Open look, take the shot!",
            "That's a good read of the play",
            "You're driving to the basket",
            "One dribble away!",
        ];
    } else if (similarity >= 0.4) {
        messages = [
            "You're finding your range",
            "Getting into the game",
            "Warming up on the court",
            "That one grazed the rim",
            "Almost in shooting position",
        ];
    } else if (similarity >= 0.2) {
        messages = [
            "Way off the rim",
            "Missed the court entirely",
            "Coach is not happy",
            "Clang! Off the backboard",
            "That shot had no chance",
        ];
    } else {
        messages = [
            "Airball! Not even close",
            "Didn't even hit the backboard",
            "You shot at the wrong hoop",
            "Bench yourself and rethink",
            "That shot left the building",
        ];
    }
    return messages[Math.floor(Math.random() * messages.length)];
}

function formatTime({ minutes, seconds, total }: CountdownRenderProps) {
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
    const noFutureGame = gameStatus === "no-game" && !nextGameDate;

    const {
        riddles,
        category,
        hasLoadedOnce: riddlesReady,
        error: riddlesError,
    } = useFanaticRiddles({ enabled: hasActiveGame });
    const { 
        answer, 
        loading: 
        submitting, 
        error: submitError 
    } = useSubmitFanaticAnswer();
    const {
        triesInfo,
        hasLoadedOnce: triesReady,
        error: triesError,
        refreshTriesInfo,
    } = useFanaticTries({ enabled: hasActiveGame && hasAuthenticatedUser });
    const {
        bestTry,
        hasLoadedOnce: bestTryReady,
        error: bestTryError,
        refreshBestTry,
    } = useFanaticBestTry({ enabled: hasActiveGame && hasAuthenticatedUser });
    const {
        nextRiddleDate,
        hasLoadedOnce: nextRiddleReady,
        error: nextRiddleError,
    } = useFanaticNextRiddleDate({ enabled: hasActiveGame });

    const [guess, setGuess] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitResult, setSubmitResult] = useState<FanaticAnswer | null>(null);

    const handleGuess = async () => {
        if (!guess.trim()) return;

        try {
            const result = await answer(guess);

            if (!result) return;

            setSubmitResult(result);
            setDialogOpen(true);
            refreshTriesInfo();
            refreshBestTry();
        } catch {
            setSubmitResult(null);
            setDialogOpen(true);
        }
    };
    
    /*
    A game is active but UI is still waiting for the riddles, 
    the next riddle, or, if the user is logged in, 
    their tries and best try to finish loading.
    */
    const isInitialActiveGameLoad =
        hasActiveGame &&
        (!riddlesReady ||
            (hasAuthenticatedUser && (!triesReady || !bestTryReady)) ||
            !nextRiddleReady);

    if (profileLoading || gameLoading || isInitialActiveGameLoad) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <NavBar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-xl font-anton animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (gameStatus === "no-game" && nextGameDate) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <NavBar />
                <div className="flex-1 flex items-center justify-center p-6">
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
            </div>
        );
    }

    if (noFutureGame) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <NavBar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-xl text-black font-anton text-center">
                        No active game right now. Check back later!
                    </p>
                </div>
            </div>
        );
    }

    if (gameError || riddlesError || triesError || bestTryError || nextRiddleError) {
        return (
            <div className="flex flex-col h-screen overflow-hidden">
                <NavBar />
                <div className="flex-1 flex items-center justify-center p-6">
                    <p className="text-xl text-red-500 font-anton text-center">
                        Oops! Something went wrong fetching the data.
                    </p>
                </div>
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
            <div className="min-h-screen flex flex-col">
                <NavBar />
                <div className="flex-1 flex flex-col">
                    {/* Header section with Tries Info */}
                    <div className="w-full flex justify-between items-center px-10 py-8">
                        <div className="flex items-center gap-3">
                            <span className="font-anton text-5xl text-primary">{bestTry?.highest_similarity ?? 0}%</span>
                            <span className="font-lato text-sm text-black">Best<br />Try</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-anton text-5xl text-primary">{triesInfo?.remaining_tries_game ?? 0}</span>
                            <span className="font-lato text-sm text-black">Attempts<br />Remaining</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 p-6 max-w-2xl mx-auto items-center w-full">
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
                        <div className="w-full flex flex-col gap-4 pb-4 mt-auto">
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
                    </div>

                    {/* Result Dialog */}
                    <Dialog isOpen={dialogOpen} className="max-w-2xl mx-auto">
                        <div className="flex flex-col gap-3 text-center items-center">
                            <h2 className={`text-3xl font-anton ${submitError ? 'text-red-500' : 'text-black'} mb-2`}>
                                {handleSimilarityText(submitResult?.similarity_score ?? null)}
                            </h2>
                        {submitError ? (
                            <p className="text-black font-lato text-lg text-center">
                                There was an error submitting your guess. Please try again later.
                            </p>
                        ) : (
                            <>
                                <h4 className="text-xl font-lato text-black font-semibold">
                                Similarity Score:
                                </h4>
                                <p className="font-lato text-lg">
                                    {submitResult ? `${(submitResult.similarity_score * 100).toFixed(2)}%` : "N/A"}
                                </p>
                                <h4 className="text-xl font-lato text-black font-semibold">
                                Awarded Points:
                                </h4>
                                <p className="font-lato text-lg">
                                    {submitResult ? submitResult.awarded_points : "N/A"}
                                </p>
                            </>
                        )}
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
            </div>

            {/* Footer Section with How to Play */}
            <section className="w-full bg-secondary text-white px-6 py-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-4 text-center">
                    <div className="text-center">
                        <h2 className="font-anton text-5xl m-4">How to Play</h2>
                    </div>
                    <div className="flex flex-col gap-6 text-left"> 
                    <div className="max-w-3xl mx-auto">
                        <h3 className="font-anton text-3xl">Steps</h3>
                        <p className="font-lato text-base mt-2">
                            Log in, open the active Fanatic challenge, read the current clues, and submit your guess for the person, place, or thing behind the category.
                        </p>
                        <p className="font-lato text-base mt-2">
                            Keep checking back as the game progresses, because new clues unlock over time and the page shows when the next riddle will appear.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <h3 className="font-anton text-3xl">Rules</h3>
                        <p className="font-lato text-base mt-2">
                            You get 1 attempt every 24 hours and up to 3 attempts total for the whole game.
                        </p>
                        <p className="font-lato text-base mt-2">
                            Answers are evaluated by meaning, not only exact wording, so close guesses can still score based on similarity.
                        </p>
                        <p className="font-lato text-base mt-2">
                            Guessing earlier is better because the score multiplier decreases as days pass, and your best similarity plus remaining attempts are shown at the top.
                        </p>
                    </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Fanatic;
