export type PredictionOption = "Triple" | "Double" | "Foul";
export type PredictionSelection = PredictionOption | "No Choice";

type MockPredictionResult = {
  actual: PredictionOption;
  otherCorrectGuessers: number;
};

const mockPredictionResults: MockPredictionResult[] = [
  { actual: "Double", otherCorrectGuessers: 0 },
  { actual: "Triple", otherCorrectGuessers: 1 },
  { actual: "Foul", otherCorrectGuessers: 0 },
  { actual: "Double", otherCorrectGuessers: 1 },
  { actual: "Triple", otherCorrectGuessers: 0 },
];

export const predictionOptions: PredictionOption[] = [
  "Triple",
  "Double",
  "Foul",
];

export function getMockPredictionResult( //TEST PARA ACTUALIZACION
  round: number,
  selectedPrediction: PredictionSelection
) {
  const result = mockPredictionResults[round % mockPredictionResults.length];
  const totalCorrectGuessers =
    result.otherCorrectGuessers +
    (selectedPrediction !== "No Choice" && result.actual === selectedPrediction ? 1 : 0);

  return {
    actual: result.actual,
    totalCorrectGuessers,
  };
}

export function buildPredictionAnnouncement(
  selectedPrediction: PredictionSelection,
  round: number
) {
  const result = getMockPredictionResult(round, selectedPrediction);

  if (result.totalCorrectGuessers === 0) {
    return {
      actual: result.actual,
      text: `No one guessed correctly. Result: ${result.actual}.`,
    };
  }

  if (result.totalCorrectGuessers === 1) {
    return {
      actual: result.actual,
      text: `1 person guessed correctly. Result: ${result.actual}.`,
    };
  }

  return {
    actual: result.actual,
    text: `${result.totalCorrectGuessers} people guessed correctly. Result: ${result.actual}.`,
  };
}
