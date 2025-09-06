import React from "react";

interface TypeRecommendation {
  type: string;
  multiplier: number;
  rationale: string;
}

interface TypeEffectivenessCardProps {
  data: TypeRecommendation[];
  opponentTypes?: string[];
}

const typeColors: Record<string, string> = {
  normal: "from-gray-400 to-gray-500",
  fire: "from-red-500 to-red-600",
  water: "from-blue-500 to-blue-600",
  electric: "from-yellow-400 to-yellow-500",
  grass: "from-green-500 to-green-600",
  ice: "from-blue-300 to-blue-400",
  fighting: "from-red-700 to-red-800",
  poison: "from-purple-500 to-purple-600",
  ground: "from-yellow-600 to-yellow-700",
  flying: "from-indigo-400 to-indigo-500",
  psychic: "from-pink-500 to-pink-600",
  bug: "from-green-400 to-green-500",
  rock: "from-yellow-800 to-yellow-900",
  ghost: "from-purple-700 to-purple-800",
  dragon: "from-indigo-700 to-indigo-800",
  dark: "from-gray-800 to-gray-900",
  steel: "from-gray-500 to-gray-600",
  fairy: "from-pink-300 to-pink-400",
};

function EffectivenessIndicator({ multiplier }: { multiplier: number }) {
  const getColor = () => {
    if (multiplier >= 2) return "text-green-600";
    if (multiplier === 1) return "text-yellow-600";
    if (multiplier > 0) return "text-orange-600";
    return "text-red-600";
  };
  
  const getLabel = () => {
    if (multiplier >= 4) return "4×";
    if (multiplier >= 2) return "2×";
    if (multiplier === 1) return "1×";
    if (multiplier === 0.5) return "½×";
    if (multiplier === 0.25) return "¼×";
    return `${multiplier}×`;
  };
  
  return (
    <span className={`font-bold text-lg ${getColor()}`}>
      {getLabel()}
    </span>
  );
}

export default function TypeEffectivenessCard({ data, opponentTypes }: TypeEffectivenessCardProps) {
  const superEffective = data.filter(d => d.multiplier >= 2);
  const neutral = data.filter(d => d.multiplier === 1);
  const notVeryEffective = data.filter(d => d.multiplier < 1 && d.multiplier > 0);
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg overflow-hidden border border-gray-200 max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3">
        <h3 className="text-lg font-bold">Type Effectiveness Analysis</h3>
        {opponentTypes && (
          <div className="text-sm mt-1 opacity-90">
            Against: {opponentTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(" / ")}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {/* Super Effective Types */}
        {superEffective.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Super Effective
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {superEffective.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${
                        typeColors[item.type] || "from-gray-400 to-gray-500"
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </div>
                    <EffectivenessIndicator multiplier={item.multiplier} />
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Neutral Types */}
        {neutral.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Neutral Damage
            </h4>
            <div className="flex flex-wrap gap-2">
              {neutral.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2"
                >
                  <div
                    className={`px-2 py-0.5 rounded-full text-white text-xs font-bold bg-gradient-to-r ${
                      typeColors[item.type] || "from-gray-400 to-gray-500"
                    }`}
                  >
                    {item.type}
                  </div>
                  <EffectivenessIndicator multiplier={item.multiplier} />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Not Very Effective */}
        {notVeryEffective.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Not Very Effective
            </h4>
            <div className="flex flex-wrap gap-2">
              {notVeryEffective.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                >
                  <div
                    className={`px-2 py-0.5 rounded-full text-white text-xs font-bold bg-gradient-to-r ${
                      typeColors[item.type] || "from-gray-400 to-gray-500"
                    }`}
                  >
                    {item.type}
                  </div>
                  <EffectivenessIndicator multiplier={item.multiplier} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
