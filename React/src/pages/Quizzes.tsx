import { useMemo, useState } from "react";
import NavBar from "../components/layout/NavBar";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";
import { useQuizzes } from "../hooks/useQuizzes";
import { useQuizQuestions } from "../hooks/useQuizQuestion";
import { useSubmitQuiz } from "../hooks/useSubmitQuiz";
import ArrowLeftIcon from "@heroicons/react/24/solid/esm/ArrowLeftIcon";

type ScreenState = "list" | "detail" | "active" | "result";

function isFutureDate(date?: Date | null) {
  return !!date && date.getTime() > Date.now();
}

function formatRemaining(date?: Date | null) {
  if (!date) return "";
  const diff = date.getTime() - Date.now();

  if (diff <= 0) return "Available now";

  const totalMinutes = Math.floor(diff / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Quizzes() {
  const [screen, setScreen] = useState<ScreenState>("list");
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const {
    quizzes,
    loading: quizzesLoading,
    error: quizzesError,
    refresh: refreshQuizzes,
    isAuthenticated,
  } = useQuizzes();

  const {
    questions,
    loading: questionsLoading,
    error: questionsError,
  } = useQuizQuestions(screen === "active" || screen === "detail" ? selectedQuiz?.id : null);

  const {
    submitQuiz,
    loading: submitLoading,
    error: submitError,
  } = useSubmitQuiz();

  const currentQuestion = questions[currentQuestionIndex];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  }, [currentQuestionIndex, questions.length]);

  const handleSelectQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);

    if (quiz.status === "cooldown" && quiz.last_result) {
      setLatestResult(quiz.last_result);
    } else {
      setLatestResult(null);
    }

    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setScreen("detail");
  };

  const handleStartQuiz = () => {
    if (!selectedQuiz || selectedQuiz.status === "cooldown") return;
    if (!isAuthenticated) return;

    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setLatestResult(null);
    setScreen("active");
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuiz) return;

    const answers = Object.entries(selectedAnswers).map(([question_id, option_id]) => ({
      question_id: Number(question_id),
      option_id: Number(option_id),
    }));

    const result = await submitQuiz({
      quiz_id: Number(selectedQuiz.id),
      answers,
    });

    if (!result) {
      setErrorDialogOpen(true);
      return;
    }

    setLatestResult(result);
    setScreen("result");
    refreshQuizzes();
  };

  const allQuestionsAnswered =
    questions.length > 0 &&
    questions.every((question: any) => selectedAnswers[question.id]);

  const selectedOptionForCurrentQuestion = currentQuestion
    ? selectedAnswers[currentQuestion.id]
    : null;

  if (quizzesLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-anton text-2xl animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (quizzesError) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="font-anton text-xl text-red-500 text-center">
            Oops! Something went wrong loading the quizzes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[var(--color-text-light-soft)]">
        <NavBar />

        {screen === "list" && (
          <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
            <div className="text-center mb-8">
              <p className="font-lato text-sm uppercase tracking-[0.2em] text-gray-500">
                Fan Community
              </p>
              <h1 className="font-anton text-5xl text-secondary mt-2">Quiz Your Game</h1>
              <p className="font-lato text-base text-black mt-3">
                Take a quiz and discover your Warriors identity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz: any) => {
                const isCooldown = quiz.status === "cooldown";

                return (
                  <button
                    key={quiz.id}
                    onClick={() => handleSelectQuiz(quiz)}
                    className="text-left rounded-3xl overflow-hidden shadow-md border border-gray-200 bg-white hover:shadow-lg transition"
                  >
                    <div className="relative h-64">
                      <img
                        src={quiz.image_url}
                        alt={quiz.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      <div className="absolute top-4 right-4">
                        {isCooldown ? (
                          <span className="bg-black/70 text-white text-xs font-lato px-3 py-1 rounded-full">
                            Available in {formatRemaining(quiz.available_again_at)}
                          </span>
                        ) : (
                          <span className="bg-secondary text-white text-xs font-lato px-3 py-1 rounded-full">
                            Available
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="font-lato text-sm text-white/80 mb-1">
                          {quiz.question_count} Questions · Once a week
                        </p>
                        <h2 className="font-anton text-3xl text-white leading-none">
                          {quiz.title}
                        </h2>
                        <p className="font-lato text-sm text-white/90 mt-2 line-clamp-2">
                          {quiz.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "detail" && selectedQuiz && (
            <div className="flex-1">
                <div className="relative h-[170px] md:h-[210px] lg:h-[235px]">
                <img
                    src={selectedQuiz.image_url}
                    alt={selectedQuiz.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute top-5 left-5">
                    <button
                        type="button"
                        onClick={() => setScreen("list")}
                        aria-label="Go back"
                        className="
                            flex h-10 w-10 items-center justify-center
                            rounded-xl
                            bg-white/10
                            text-white
                            backdrop-blur-sm
                            border border-white/20
                            transition
                            hover:bg-white/20
                        "
                        >
                        <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-6 pb-5">
                    <p className="font-lato text-xs md:text-sm uppercase tracking-[0.2em] text-secondary">
                    Featured Quiz
                    </p>
                    <h1 className="font-anton text-white text-4xl md:text-5xl mt-2 leading-none">
                    {selectedQuiz.title}
                    </h1>
                </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 py-5">
                <div className="grid grid-cols-3 gap-4 text-center mb-5">
                    <div className="rounded-2xl bg-gray-100 border border-primary/30 shadow-sm p-3">
                    <p className="font-anton text-3xl text-secondary">
                        {selectedQuiz.question_count}
                    </p>
                    <p className="font-lato text-sm text-black">Questions</p>
                    </div>

                    <div className="rounded-2xl bg-gray-100 border border-primary/30 shadow-sm p-3">
                    <p className="font-anton text-3xl text-secondary">1×</p>
                    <p className="font-lato text-sm text-black">Per week</p>
                    </div>

                    <div className="rounded-2xl bg-gray-100 border border-primary/30 shadow-sm p-3">
                    <p className="font-anton text-3xl text-secondary">
                        {selectedQuiz.status === "cooldown" ? "Locked" : "Open"}
                    </p>
                    <p className="font-lato text-sm text-black">Status</p>
                    </div>
                </div>

                <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 mb-5">
                    <p className="font-lato text-base text-black leading-7 text-center max-w-3xl mx-auto">
                    {selectedQuiz.description}
                    </p>
                </div>

                {selectedQuiz.status === "cooldown" && isFutureDate(selectedQuiz.available_again_at) ? (
                    <>
                    <div className="rounded-3xl bg-secondary text-white p-5 mb-5">
                        <p className="font-lato text-sm uppercase tracking-[0.2em] opacity-80">
                        Available again in
                        </p>
                        <p className="font-anton text-4xl mt-2">
                        {formatRemaining(selectedQuiz.available_again_at)}
                        </p>
                    </div>

                    {selectedQuiz.last_result && (
                        <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                        <div className="relative h-72">
                            <img
                            src={selectedQuiz.last_result.image_url}
                            alt={selectedQuiz.last_result.title}
                            className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                            <p className="font-lato text-white/80 text-sm">Your last result</p>
                            <h2 className="font-anton text-white text-4xl">
                                {selectedQuiz.last_result.title}
                            </h2>
                            <p className="font-lato text-white mt-1">
                                {selectedQuiz.last_result.subtitle}
                            </p>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="font-lato text-black leading-7">
                            {selectedQuiz.last_result.description}
                            </p>
                        </div>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="max-w-md mx-auto">
                    <Button
                        variant="secondary"
                        className="w-full font-anton text-2xl py-4"
                        onClick={handleStartQuiz}
                        disabled={!isAuthenticated}
                    >
                        {!isAuthenticated ? "Login to Start" : "Start Quiz!"}
                    </Button>
                    </div>
                )}
                </div>
            </div>
            )}

        {screen === "active" && (
          <div className="flex-1">
            {questionsLoading ? (
              <div className="flex items-center justify-center h-[60vh]">
                <p className="font-anton text-2xl animate-pulse">Loading questions...</p>
              </div>
            ) : questionsError ? (
              <div className="flex items-center justify-center h-[60vh] px-6">
                <p className="font-anton text-xl text-red-500 text-center">
                  Oops! Something went wrong loading the questions.
                </p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-anton text-3xl text-secondary">
                      {selectedQuiz?.title}
                    </h2>
                    <p className="font-lato text-sm text-black">
                      {currentQuestionIndex + 1} / {questions.length}
                    </p>
                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {currentQuestion && (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 lg:gap-8 items-center">
                        {/* QUESTION CARD */}
                        <div className="relative rounded-[2rem] overflow-hidden border border-gray-200 bg-white shadow-sm min-h-[220px] lg:min-h-[300px]">
                            {/* Decorative corners */}
                            <div className="absolute top-4 left-4 w-10 h-10 border-l-2 border-t-2 border-primary/50 rounded-tl-md" />
                            <div className="absolute top-4 right-4 w-10 h-10 border-r-2 border-t-2 border-primary/50 rounded-tr-md" />
                            <div className="absolute bottom-4 left-4 w-10 h-10 border-l-2 border-b-2 border-primary/50 rounded-bl-md" />
                            <div className="absolute bottom-4 right-4 w-10 h-10 border-r-2 border-b-2 border-primary/50 rounded-br-md" />

                            <div className="h-full flex items-center justify-center px-8 py-8 lg:px-10">
                            <h3 className="font-lato text-black text-2xl md:text-3xl text-center leading-snug max-w-[26rem]">
                                {currentQuestion.question_text}
                            </h3>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center gap-3">
                            {currentQuestion.options
                            .sort((a: any, b: any) => a.option_order - b.option_order)
                            .map((option: any) => {
                                const isSelected = selectedOptionForCurrentQuestion === option.id;

                                return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                                    className={`
                                    w-full rounded-2xl px-5 py-5 text-center
                                    font-lato text-lg md:text-xl
                                    border transition-all duration-200 shadow-sm
                                    ${
                                        isSelected
                                            ? "bg-secondary text-white border-secondary scale-[1.01] shadow-md"
                                            : "bg-white text-black border-gray-200 hover:bg-gray-50 hover:border-primary"
                                    }
                                    `}
                                >
                                    {option.option_text}
                                </button>
                                );
                            })}
                        </div>
                        </div>
                            <div className="flex flex-col md:flex-row gap-4 mt-6">
                            <Button
                                variant="secondary"
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="w-full font-anton text-xl"
                            >
                                Back
                            </Button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <Button
                                variant="secondary"
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered || submitLoading}
                                className="w-full font-anton text-xl"
                                >
                                {submitLoading ? "Submitting..." : "Send Answers"}
                                </Button>
                            ) : (
                                <Button
                                variant="secondary"
                                onClick={handleNextQuestion}
                                disabled={!selectedOptionForCurrentQuestion}
                                className="w-full font-anton text-xl"
                                >
                                Next
                                </Button>
                            )}
                            </div>
                    </>
                    )}
              </div>
            )}
          </div>
        )}

        {screen === "result" && latestResult && (
          <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
            <div className="text-center mb-8">
              <p className="font-lato text-sm uppercase tracking-[0.2em] text-gray-500">
                Quiz Complete
              </p>
              <h1 className="font-anton text-5xl text-primary mt-2">Your Results</h1>
            </div>

            <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              <div className="relative h-[420px]">
                <img
                  src={latestResult.image_url}
                  alt={latestResult.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-lato text-white/80 text-sm uppercase tracking-[0.2em]">
                    Your perfect match is...
                  </p>
                  <h2 className="font-anton text-white text-6xl mt-2">
                    {latestResult.title}
                  </h2>
                  <p className="font-lato text-white text-lg mt-2">
                    {latestResult.subtitle}
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <p className="font-lato text-black leading-8 text-lg">
                  {latestResult.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <Button
                variant="secondary"
                className="w-full font-anton text-xl"
                onClick={() => setScreen("list")}
              >
                More Quizzes
              </Button>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  const shareText = `I got "${latestResult.title}" on the Warriors quiz! 🏀`;

                  if (navigator.share) {
                    navigator.share({ text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                  }
                }}
              >
                Share Your Results
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog isOpen={errorDialogOpen} className="max-w-lg mx-auto">
        <div className="flex flex-col gap-4 items-center text-center">
          <h2 className="font-anton text-3xl text-red-500">Oops!</h2>
          <p className="font-lato text-black text-base">
            {submitError || "There was an error submitting your quiz. Please try again."}
          </p>
          <Button variant="primary" onClick={() => setErrorDialogOpen(false)} className="w-full">
            Close
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default Quizzes;