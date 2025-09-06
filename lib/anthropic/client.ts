import Anthropic from "@anthropic-ai/sdk";

export function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  
  // Validate API key format
  if (apiKey.includes('\n') || apiKey.includes('\r')) {
    throw new Error("ANTHROPIC_API_KEY contains line breaks - check your .env.local file");
  }
  
  // Use the latest beta version for tool support
  const version = process.env.ANTHROPIC_VERSION || "2023-06-01";
  
  return new Anthropic({
    apiKey,
    defaultHeaders: {
      "anthropic-version": version,
      "anthropic-beta": "tools-2024-05-16",  // Enable tools beta
    },
  });
}
