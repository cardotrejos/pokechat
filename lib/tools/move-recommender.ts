import type { ToolSpec, ToolResult } from "@/types/chat";
import { MoveRecommenderInput, type TMoveRecommenderInput, MoveRecommenderJsonSchema } from "@/lib/schemas/tools";

type TypeChart = {
  types: string[];
  matrix: number[][];
};

function computeMultipliers(opponentTypes: string[], typeChart: TypeChart) {
  const names = typeChart.types as string[];
  const matrix = typeChart.matrix as number[][];
  const results: Array<{ type: string; multiplier: number }> = [];

  for (let i = 0; i < names.length; i++) {
    const atk = names[i];
    let mult = 1;
    for (const defNameRaw of opponentTypes) {
      const defName = defNameRaw.toLowerCase();
      const j = names.indexOf(defName);
      if (j === -1) continue; // unknown types ignored
      mult *= matrix[i][j];
    }
    results.push({ type: atk, multiplier: mult });
  }

  results.sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type));
  return results;
}

export function createMoveRecommenderTool(): ToolSpec {
  return {
    name: "advice_move_recommender",
    description: "Recommend best attacking types vs given opponent types using the Pokémon type chart.",
    jsonSchema: MoveRecommenderJsonSchema,
    async execute(input: unknown): Promise<ToolResult> {
      try {
        const parsed = MoveRecommenderInput.parse(input as TMoveRecommenderInput);
        const chartData: TypeChart = (await import("@/data/type-chart.json")).default as TypeChart;
        const ranked = computeMultipliers(parsed.opponentTypes.map((t) => t.toLowerCase()), chartData);
        const pruned = ranked
          .filter((r) => r.multiplier > 0)
          .slice(0, parsed.topK ?? 5)
          .map((r) => ({
            type: r.type,
            multiplier: r.multiplier,
            rationale:
              r.multiplier >= 2
                ? `${r.type} is super-effective overall (${r.multiplier}×)`
                : r.multiplier === 1
                ? `${r.type} is neutral (1×)`
                : `${r.type} is not very effective (${r.multiplier}×)`,
          }));
        return { ok: true, data: pruned };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { ok: false, error: message };
      }
    },
  };
}
