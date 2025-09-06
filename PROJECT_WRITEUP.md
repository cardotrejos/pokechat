# PokéChat AI Assistant – Project Writeup

## 1. Design Decisions

### Why Streaming With SSE
I went with **Server-Sent Events (SSE)** for real-time output from Claude to the client.  
SSE hits the sweet spot here: one-way streaming is exactly what we need for AI responses, it keeps a persistent connection for coordinating tool calls, and it avoids WebSocket overkill while still letting users see results as they come in.

**How I built it**: a custom `ReadableStream` wrapper on top of Anthropic’s streaming API, structured events (`event: type\ndata: {...}\n\n`), tools running in parallel with `Promise` coordination, and full error/abort handling.

### Tool System
I designed a **registry-based tool system** that runs tools asynchronously while the stream keeps flowing.  

- Tools fire off instantly; client knows what’s happening right away  
- Results stream back as soon as they finish  
- Errors are isolated (one tool failing won’t break everything)  
- Debug logs are in place for production sanity checks  

### Clean Architecture
Everything’s in TypeScript with clear separation of concerns:

lib/anthropic/     → AI service wrapper
lib/tools/         → Tools & external APIs
lib/schemas/       → Validation & type safety
types/             → Shared type defs
app/api/           → Endpoints (HTTP + streaming)
app/components/    → Reusable UI bits
data/              → Static config (type charts, etc.)

This keeps testing, reuse, and scaling straightforward. Type safety prevents runtime surprises, and the modular layout makes adding features painless.

### Caching
PokéAPI is basically read-only data, so I added an **LRU cache with TTL**:  
- 5 min TTL  
- 200-entry limit  
- Keys include evolution-chain flag for granularity  

This slashes API calls, speeds things up, and still keeps data reasonably fresh.

### Data Normalization
All PokéAPI responses get normalized before hitting the client.  
That means: simpler client logic, consistent structures across endpoints, smaller payloads, and guaranteed type safety.

### UI/UX Philosophy
Built a **Pokédex-style UI** that feels fun but also functional:  
- Authentic shell look and colors  
- Live streaming with “typing” indicators  
- Expandable accordions for tool calls (transparency)  
- Interactive Pokémon/type data cards  
- Responsive for both desktop and mobile  

---

## 2. Challenges & Fixes

### 1. Running Tools While Streaming
Claude only sends tool calls at the end of its stream, but I wanted real-time tool feedback.

**Fix**:  
- Tools run concurrently with `Promise.all`  
- Custom SSE events: `tool_call`, `tool_result`  
- Streaming text keeps flowing while tools crunch in background  
- Errors isolated per tool  

### 2. Type Safety Across Async
Async boundaries, Zod schemas, and tool execution all together = messy.

**Fix**:  
- Shared type definitions in `types/chat.ts`  
- Zod + TypeScript inference = runtime + compile-time safety  
- Custom error types for async contexts  
- JSON schemas carefully crafted for Anthropic tool registration  

### 3. Type Effectiveness Math
Pokémon’s 18×18 type matrix is gnarly, especially with dual-types.

**Fix**:  
- Proper multiplier math for dual types  
- Full chart with 324 interactions  
- Strategic rationale included in explanations  
- Immunities (0×) handled cleanly  

### 4. Performance & Memory
Needed caching, but memory is limited in streaming apps.

**Fix**:  
- LRU with eviction + TTL  
- Optimized sprite selection (official artwork first)  
- Minimized payloads in events  

### 5. Error Handling in Streams
Normal error handling breaks when everything is async and streaming.

**Fix**:  
- Structured error events in SSE  
- Graceful degradation (conversation doesn’t die if tools fail)  
- Rich logging for debugging  
- Friendly error messages for users  

### 6. Multiple Tools at Once
Coordinating several concurrent tool calls without chaos.

**Fix**:  
- Promise coordination until all tools finish  
- Cleanup + abort handling for interruptions  
- Request IDs for tracking  
- Queuing to avoid overload  

---

## 3. One-Month Roadmap

### Week 1 – Smarter Tools
- Battle simulator (damage ranges, crit chance, speed tiers)  
- Team builder (type coverage, balance, viability)  
- Move database (power, accuracy, effects, usage)  
- Pokémon comparison engine  

Infra: tool chaining, cached multi-step calcs, dependency graphs.

### Week 2 – Richer Streaming
- Progressive tool results (partial outputs)  
- Let users tweak params mid-run  
- Real-time charts and battle sims  
- Voice input/output  

Infra: optional WebSockets, streaming compression, standardized protocols.

### Week 3 – Personalization
- User prefs (fav Pokémon, formats, analysis style)  
- Conversation memory across sessions  
- Proactive suggestions  
- Competitive meta integration  

Infra: secure sessions, history persistence, ML recommendation engine.

### Week 4 – Scale & Prod-Ready
- Auth + RBAC  
- Advanced rate limits with tiers  
- Analytics dashboard  
- Native mobile apps (with offline + push)  

Infra: Redis clustering, monitoring/observability, CI/CD, PWA optimization.

---

## Long-Term Vision (3–6 Months)
- Support more franchises (MTG, Yu-Gi-Oh!, etc.) with the same framework  
- Fine-tuned game-specific AI models  
- Community features (team sharing, tournaments, guides)  
- Public API + enterprise integrations  
- R&D: computer vision for card recognition, game-theory optimization, predictive meta modeling  
