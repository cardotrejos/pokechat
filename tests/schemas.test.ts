import { describe, it, expect } from 'vitest'
import { GetPokemonInput, MoveRecommenderInput } from '@/lib/schemas/tools'

describe('Tool Schemas', () => {
  describe('GetPokemonInput', () => {
    it('should validate valid string pokemon name', () => {
      const result = GetPokemonInput.safeParse({ pokemon: 'pikachu' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pokemon).toBe('pikachu')
        expect(result.data.includeEvolution).toBe(false)
      }
    })

    it('should validate valid numeric pokemon id', () => {
      const result = GetPokemonInput.safeParse({ pokemon: 25 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pokemon).toBe(25)
      }
    })

    it('should validate with includeEvolution flag', () => {
      const result = GetPokemonInput.safeParse({ 
        pokemon: 'bulbasaur', 
        includeEvolution: true 
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.includeEvolution).toBe(true)
      }
    })

    it('should reject empty string', () => {
      const result = GetPokemonInput.safeParse({ pokemon: '' })
      expect(result.success).toBe(false)
    })

    it('should reject negative numbers', () => {
      const result = GetPokemonInput.safeParse({ pokemon: -1 })
      expect(result.success).toBe(false)
    })

    it('should reject missing pokemon field', () => {
      const result = GetPokemonInput.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('MoveRecommenderInput', () => {
    it('should validate valid opponent types', () => {
      const result = MoveRecommenderInput.safeParse({ 
        opponentTypes: ['fire', 'flying'] 
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.opponentTypes).toEqual(['fire', 'flying'])
        expect(result.data.topK).toBe(5) // default
      }
    })

    it('should validate with custom topK', () => {
      const result = MoveRecommenderInput.safeParse({ 
        opponentTypes: ['water'], 
        topK: 3 
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.topK).toBe(3)
      }
    })

    it('should reject empty opponent types array', () => {
      const result = MoveRecommenderInput.safeParse({ opponentTypes: [] })
      expect(result.success).toBe(false)
    })

    it('should reject empty string in opponent types', () => {
      const result = MoveRecommenderInput.safeParse({ 
        opponentTypes: ['fire', ''] 
      })
      expect(result.success).toBe(false)
    })

    it('should reject topK out of range', () => {
      const result1 = MoveRecommenderInput.safeParse({ 
        opponentTypes: ['fire'], 
        topK: 0 
      })
      expect(result1.success).toBe(false)

      const result2 = MoveRecommenderInput.safeParse({ 
        opponentTypes: ['fire'], 
        topK: 11 
      })
      expect(result2.success).toBe(false)
    })

    it('should reject missing opponentTypes', () => {
      const result = MoveRecommenderInput.safeParse({})
      expect(result.success).toBe(false)
    })
  })
})
