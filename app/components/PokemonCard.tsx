import React from "react";

interface PokemonData {
  id: number;
  name: string;
  types: string[];
  abilities: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  sprite: string | null;
  evolutionChain?: Array<{ name: string; evolvesTo: string[] }>;
}

interface PokemonCardProps {
  data: PokemonData;
}

const typeColors: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-green-400",
  rock: "bg-yellow-800",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-700",
  dark: "bg-gray-800",
  steel: "bg-gray-500",
  fairy: "bg-pink-300",
};

function StatBar({ label, value, max = 255 }: { label: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  const barColor = 
    percentage > 80 ? "bg-green-500" :
    percentage > 60 ? "bg-yellow-500" :
    percentage > 40 ? "bg-orange-500" :
    "bg-red-500";
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 font-semibold text-gray-700">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono">{value}</span>
    </div>
  );
}

export default function PokemonCard({ data }: PokemonCardProps) {
  const totalStats = Object.values(data.baseStats).reduce((a, b) => a + b, 0);
  
  // Build a simple evolution rendering model from the chain data, if present
  // We detect root species (not present in any evolvesTo arrays) and then show
  // one level of arrows for clarity. For branched chains (e.g. Eevee), we show
  // all immediate evolutions.
  const evolutionDisplay = (() => {
    if (!data.evolutionChain || data.evolutionChain.length === 0) return null;
    const nodes = data.evolutionChain;
    const allChildren = new Set<string>();
    for (const n of nodes) for (const c of n.evolvesTo) allChildren.add(c);
    const roots = nodes.filter(n => !allChildren.has(n.name));
    return { roots, nodes };
  })();
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg overflow-hidden border border-gray-200 max-w-md">
      {/* Header with Pokemon name and ID */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold capitalize">{data.name}</h3>
          <span className="text-sm bg-white/20 px-2 py-1 rounded">#{String(data.id).padStart(3, '0')}</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Pokemon Image and Types */}
        <div className="flex gap-4 mb-4">
          {data.sprite && (
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-2">
              <img 
                src={data.sprite} 
                alt={data.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <div className="flex-1">
            {/* Types */}
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</span>
              <div className="flex gap-1 mt-1">
                {data.types.map((type) => (
                  <span
                    key={type}
                    className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      typeColors[type] || "bg-gray-400"
                    }`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Abilities */}
            <div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Abilities</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.abilities.map((ability) => (
                  <span
                    key={ability}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                  >
                    {ability.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Base Stats</span>
            <span className="text-xs text-gray-500">Total: {totalStats}</span>
          </div>
          
          <StatBar label="HP" value={data.baseStats.hp} />
          <StatBar label="ATK" value={data.baseStats.atk} />
          <StatBar label="DEF" value={data.baseStats.def} />
          <StatBar label="SP.ATK" value={data.baseStats.spa} />
          <StatBar label="SP.DEF" value={data.baseStats.spd} />
          <StatBar label="SPEED" value={data.baseStats.spe} />
        </div>

        {/* Evolution Chain (optional) */}
        {evolutionDisplay && (
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Evolution Chain</div>
            <div className="space-y-2">
              {evolutionDisplay.roots.map((root) => (
                <div key={root.name} className="flex items-center flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium capitalize">
                    {root.name}
                  </span>
                  {root.evolvesTo.length > 0 && (
                    <>
                      <span className="text-gray-400">→</span>
                      {root.evolvesTo.map((child) => (
                        <span key={child} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium capitalize">
                          {child}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1 text-[10px] text-gray-400">
              Showing immediate evolutions. Some species may have multiple branches.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
