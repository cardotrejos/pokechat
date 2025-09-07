import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPokeTools, getPokemonNormalized } from '@/lib/tools/pokeapi'

// Simple helper to create a mock fetch response
function okJson(data: any) {
  return { ok: true, json: async () => data } as any
}

function notOk(status = 404) {
  return { ok: false, status } as any
}

describe('PokéAPI Tool', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes core pokemon fields (no evolution)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // 1st call: pokemon endpoint
    fetchMock.mockResolvedValueOnce(okJson({
      id: 25,
      name: 'pikachu',
      types: [
        { slot: 1, type: { name: 'electric' } },
      ],
      abilities: [
        { ability: { name: 'static' } },
        { ability: { name: 'lightning-rod' } },
      ],
      stats: [
        { base_stat: 35, stat: { name: 'hp' } },
        { base_stat: 55, stat: { name: 'attack' } },
        { base_stat: 40, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 90, stat: { name: 'speed' } },
      ],
      sprites: {
        other: { 'official-artwork': { front_default: 'https://img/pika.png' } },
        front_default: 'https://img/fallback.png',
      },
    }))

    const result = await getPokemonNormalized({ pokemon: 'pikachu' })

    expect(result.id).toBe(25)
    expect(result.name).toBe('pikachu')
    expect(result.types).toEqual(['electric'])
    expect(result.abilities).toEqual(['static', 'lightning-rod'])
    expect(result.baseStats).toEqual({ hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 })
    expect(result.sprite).toBe('https://img/pika.png')

    // Should have called only once
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('includes evolution chain when requested (and caches results)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // 1st: pokemon endpoint
    fetchMock.mockResolvedValueOnce(okJson({
      id: 1,
      name: 'bulbasaur',
      types: [ { type: { name: 'grass' } }, { type: { name: 'poison' } } ],
      abilities: [ { ability: { name: 'overgrow' } } ],
      stats: [
        { base_stat: 45, stat: { name: 'hp' } },
        { base_stat: 49, stat: { name: 'attack' } },
        { base_stat: 49, stat: { name: 'defense' } },
        { base_stat: 65, stat: { name: 'special-attack' } },
        { base_stat: 65, stat: { name: 'special-defense' } },
        { base_stat: 45, stat: { name: 'speed' } },
      ],
      sprites: { front_default: null },
      species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
    }))

    // 2nd: species endpoint
    fetchMock.mockResolvedValueOnce(okJson({
      evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' },
    }))

    // 3rd: evolution chain endpoint
    fetchMock.mockResolvedValueOnce(okJson({
      chain: {
        species: { name: 'bulbasaur' },
        evolves_to: [{
          species: { name: 'ivysaur' },
          evolves_to: [{ species: { name: 'venusaur' }, evolves_to: [] }],
        }],
      },
    }))

    const first = await getPokemonNormalized({ pokemon: 'bulbasaur', includeEvolution: true })
    expect(first.evolutionChain).toBeDefined()
    expect(first.evolutionChain?.map(e => e.name)).toContain('bulbasaur')
    expect(first.evolutionChain?.map(e => e.name)).toContain('ivysaur')
    expect(first.evolutionChain?.map(e => e.name)).toContain('venusaur')

    // Call again with the same args — should be served from cache
    const second = await getPokemonNormalized({ pokemon: 'bulbasaur', includeEvolution: true })
    expect(second).toEqual(first)
    // Still only 3 fetch calls total
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('handles evolution fetch failure gracefully', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // pokemon endpoint
    fetchMock.mockResolvedValueOnce(okJson({
      id: 133,
      name: 'eevee',
      types: [ { type: { name: 'normal' } } ],
      abilities: [ { ability: { name: 'run-away' } } ],
      stats: [],
      sprites: {},
      species: { url: 'https://pokeapi.co/api/v2/pokemon-species/133/' },
    }))

    // species endpoint fails (simulate network error)
    fetchMock.mockRejectedValueOnce(new Error('network fail'))

    const result = await getPokemonNormalized({ pokemon: 'eevee', includeEvolution: true })
    expect(result.name).toBe('eevee')
    expect(result.evolutionChain).toBeUndefined()
  })

  it('tool.execute returns error on HTTP failure', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    // First call returns 404
    fetchMock.mockResolvedValueOnce(notOk(404))

    const [getPokemonTool] = createPokeTools()
    const res = await getPokemonTool.execute({ pokemon: 'missingno' })
    expect(res.ok).toBe(false)
    expect(res.error).toBeDefined()
  })
})

