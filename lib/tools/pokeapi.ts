import type { ToolResult, ToolSpec } from "@/types/chat";
import { GetPokemonInput, type TGetPokemonInput, GetPokemonJsonSchema } from "@/lib/schemas/tools";

type Normalized = {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  sprite: string | null;
  evolutionChain?: Array<{ name: string; evolvesTo: string[] }>;
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_ENTRIES = 200;

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<Normalized>>();

function getCache(key: string): Normalized | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

function setCache(key: string, value: Normalized) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value as string | undefined;
    if (firstKey) cache.delete(firstKey);
  }
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "pokechat/0.1" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return (await res.json()) as T;
}

function mapBaseStats(stats: any[]): Normalized["baseStats"] {
  const lookup: Record<string, number> = {};
  for (const s of stats) lookup[s.stat?.name] = s.base_stat;
  return {
    hp: lookup["hp"] ?? 0,
    atk: lookup["attack"] ?? 0,
    def: lookup["defense"] ?? 0,
    spa: lookup["special-attack"] ?? 0,
    spd: lookup["special-defense"] ?? 0,
    spe: lookup["speed"] ?? 0,
  };
}

function pickSprite(sprites: any): string | null {
  return (
    sprites?.other?.["official-artwork"]?.front_default ||
    sprites?.front_default ||
    null
  );
}

async function getEvolutionChain(chainUrl: string): Promise<Array<{ name: string; evolvesTo: string[] }>> {
  type EvoNode = { species: { name: string }; evolves_to: EvoNode[] };
  type Chain = { chain: EvoNode };
  const data = await fetchJSON<Chain>(chainUrl);
  const result: Array<{ name: string; evolvesTo: string[] }> = [];
  const visit = (node: EvoNode) => {
    result.push({ name: node.species.name, evolvesTo: node.evolves_to.map((n) => n.species.name) });
    node.evolves_to.forEach(visit);
  };
  visit(data.chain);
  return result;
}

export async function getPokemonNormalized(input: TGetPokemonInput): Promise<Normalized> {
  const parsed = GetPokemonInput.parse(input);
  const key = `${parsed.pokemon}|${parsed.includeEvolution ? 1 : 0}`;
  const cached = getCache(key);
  if (cached) return cached;

  const idOrName = String(parsed.pokemon).toLowerCase();
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(idOrName)}`;
  const p = await fetchJSON<any>(pokemonUrl);

  const normalized: Normalized = {
    id: p.id,
    name: p.name,
    types: (p.types || []).map((t: any) => t.type?.name).filter(Boolean),
    abilities: (p.abilities || []).map((a: any) => a.ability?.name).filter(Boolean),
    baseStats: mapBaseStats(p.stats || []),
    sprite: pickSprite(p.sprites),
  };

  if (parsed.includeEvolution) {
    try {
      const species = await fetchJSON<any>(p.species?.url);
      const chainUrl: string | undefined = species?.evolution_chain?.url;
      if (chainUrl) normalized.evolutionChain = await getEvolutionChain(chainUrl);
    } catch {
      // optional
    }
  }

  setCache(key, normalized);
  return normalized;
}

export function createPokeTools(): ToolSpec[] {
  const getPokemonSpec: ToolSpec = {
    name: "pokeapi.getPokemon",
    description: "Fetch normalized Pokémon data by name or id with optional evolution chain",
    jsonSchema: GetPokemonJsonSchema,
    async execute(input: unknown): Promise<ToolResult> {
      try {
        const value = await getPokemonNormalized(input as TGetPokemonInput);
        return { ok: true, data: value };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { ok: false, error: message };
      }
    },
  };
  return [getPokemonSpec];
}
