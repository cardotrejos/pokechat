import { describe, it, expect } from 'vitest'
import { createMoveRecommenderTool } from '@/lib/tools/move-recommender'

describe('Move Recommender Tool', () => {
  const tool = createMoveRecommenderTool()

  it('should have correct tool specification', () => {
    expect(tool.name).toBe('advice_move_recommender')
    expect(tool.description).toContain('attacking types')
    expect(tool.jsonSchema).toBeDefined()
  })

  it('should recommend electric as super effective against water/flying', async () => {
    const result = await tool.execute({
      opponentTypes: ['water', 'flying'],
      topK: 5
    })

    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
    
    if (result.data && Array.isArray(result.data)) {
      const electricResult = result.data.find((r: any) => r.type === 'electric')
      expect(electricResult).toBeDefined()
      expect(electricResult.multiplier).toBe(4) // 2x vs water, 2x vs flying = 4x
      expect(electricResult.rationale).toContain('super-effective')
    }
  })

  it('should exclude ground moves against flying types', async () => {
    const result = await tool.execute({
      opponentTypes: ['flying'],
      topK: 10
    })

    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
    
    if (result.data && Array.isArray(result.data)) {
      const groundResult = result.data.find((r: any) => r.type === 'ground')
      expect(groundResult).toBeUndefined() // Should be filtered out (0x effectiveness)
    }
  })

  it('should respect topK parameter', async () => {
    const result = await tool.execute({
      opponentTypes: ['fire'],
      topK: 3
    })

    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
    
    if (result.data && Array.isArray(result.data)) {
      expect(result.data.length).toBeLessThanOrEqual(3)
    }
  })

  it('sorts by multiplier then type name for ties', async () => {
    const result = await tool.execute({ opponentTypes: ['normal'], topK: 5 })
    expect(result.ok).toBe(true)
    if (result.data && Array.isArray(result.data)) {
      // Against normal, super-effective types are fighting (2x); immunities not present
      // After that, many 1x types should be ordered alphabetically by type name
      const names = (result.data as any[]).map(r => r.type)
      expect(names[0]).toBe('fighting')
      // Confirm alphabetical order among 1x entries (subset check)
      const ones = (result.data as any[]).filter(r => r.multiplier === 1).map(r => r.type)
      const sorted = [...ones].sort((a,b) => a.localeCompare(b))
      expect(ones).toEqual(sorted)
    }
  })

  it('provides rationale text aligned with multiplier', async () => {
    const result = await tool.execute({ opponentTypes: ['rock', 'ice'], topK: 5 })
    expect(result.ok).toBe(true)
    if (result.data && Array.isArray(result.data)) {
      // Fighting should be 4x vs rock+ice -> should say super-effective
      const fighting = (result.data as any[]).find(r => r.type === 'fighting')
      expect(fighting).toBeDefined()
      expect(fighting!.multiplier).toBeGreaterThanOrEqual(2)
      expect(String(fighting!.rationale).toLowerCase()).toContain('super-effective')
    }
  })

  it('should handle invalid input gracefully', async () => {
    const result = await tool.execute({
      opponentTypes: [], // Invalid: empty array
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('should handle unknown types gracefully', async () => {
    const result = await tool.execute({
      opponentTypes: ['unknown-type'],
      topK: 5
    })

    expect(result.ok).toBe(true)
    expect(result.data).toBeDefined()
    // Should still return results, just ignoring unknown types
  })
})
