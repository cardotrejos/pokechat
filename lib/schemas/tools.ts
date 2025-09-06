import { z } from "zod";

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
// Must be plain objects with top-level type: 'object'
export const GetPokemonJsonSchema = {
  type: "object",
  properties: {
    pokemon: {
      anyOf: [
        { type: "string", minLength: 1 },
        { type: "integer", minimum: 0 },
      ],
      description: "Name (string) or id (integer) of the Pokémon",
    },
    includeEvolution: {
      type: "boolean",
      description: "Include evolution chain data",
    },
  },
  required: ["pokemon"],
  additionalProperties: false,
} as const as Record<string, unknown>;

export const MoveRecommenderJsonSchema = {
  type: "object",
  properties: {
    opponentTypes: {
      type: "array",
      items: { type: "string", minLength: 1 },
      minItems: 1,
      description: "Defending types, e.g., ['fire','flying']",
    },
    topK: { type: "integer", minimum: 1, maximum: 10, description: "Top-N types to return" },
  },
  required: ["opponentTypes"],
  additionalProperties: false,
} as const as Record<string, unknown>;
