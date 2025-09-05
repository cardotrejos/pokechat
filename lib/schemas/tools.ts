import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Zod schemas for tools
export const GetPokemonInput = z.object({
  pokemon: z.union([z.string().min(1), z.number().int().nonnegative()]),
  includeEvolution: z.boolean().default(false).optional(),
});

export const MoveRecommenderInput = z.object({
  opponentTypes: z.array(z.string().min(1)).min(1),
  topK: z.number().int().min(1).max(10).default(5).optional(),
});

// Inferred TypeScript types
export type TGetPokemonInput = z.infer<typeof GetPokemonInput>;
export type TMoveRecommenderInput = z.infer<typeof MoveRecommenderInput>;

// JSON Schemas for Anthropic tool registration
export const GetPokemonJsonSchema = zodToJsonSchema(
  GetPokemonInput,
  "GetPokemonInput"
) as Record<string, unknown>;

export const MoveRecommenderJsonSchema = zodToJsonSchema(
  MoveRecommenderInput,
  "MoveRecommenderInput"
) as Record<string, unknown>;
