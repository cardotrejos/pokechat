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
