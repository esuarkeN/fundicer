import { Navigate, useParams } from "react-router-dom";
import {
  DEFAULT_FUNDICER_PUZZLE_ID,
  FUNDICER_PUZZLES,
  FUNDICER_PUZZLES_BY_ID,
} from "@/data/fundicerPuzzles";
import { FundicerPuzzleRoom } from "@/features/fundicer/FundicerPuzzleRoom";

export function D20Room() {
  const { puzzleId } = useParams<{ puzzleId?: string }>();

  if (!DEFAULT_FUNDICER_PUZZLE_ID) {
    return null;
  }

  if (!puzzleId) {
    return <Navigate replace to={`/d20/${DEFAULT_FUNDICER_PUZZLE_ID}`} />;
  }

  const puzzle = FUNDICER_PUZZLES_BY_ID[puzzleId];

  if (!puzzle) {
    return <Navigate replace to={`/d20/${DEFAULT_FUNDICER_PUZZLE_ID}`} />;
  }

  return <FundicerPuzzleRoom key={puzzle.id} puzzle={puzzle} puzzles={FUNDICER_PUZZLES} />;
}
