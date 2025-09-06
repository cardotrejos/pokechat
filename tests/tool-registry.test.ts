import { describe, it, expect } from 'vitest'
import { listTools, getToolByName } from '@/lib/tools'

describe('Tool Registry', () => {
  it('should list all available tools', () => {
    const tools = listTools()
    expect(tools).toBeDefined()
    expect(Array.isArray(tools)).toBe(true)
    expect(tools.length).toBeGreaterThan(0)
    
    // Should have both main tools
    const toolNames = tools.map(t => t.name)
    expect(toolNames).toContain('pokeapi_get_pokemon')
    expect(toolNames).toContain('advice_move_recommender')
  })

  it('should get tool by exact name', () => {
    const pokeTool = getToolByName('pokeapi_get_pokemon')
    expect(pokeTool).toBeDefined()
    expect(pokeTool?.name).toBe('pokeapi_get_pokemon')
    expect(pokeTool?.execute).toBeDefined()
    expect(pokeTool?.jsonSchema).toBeDefined()

    const moveTool = getToolByName('advice_move_recommender')
    expect(moveTool).toBeDefined()
    expect(moveTool?.name).toBe('advice_move_recommender')
  })

  it('should return undefined for unknown tool name', () => {
    const unknownTool = getToolByName('nonexistent_tool')
    expect(unknownTool).toBeUndefined()
  })

  it('should have properly structured tool specs', () => {
    const tools = listTools()
    
    for (const tool of tools) {
      expect(tool.name).toBeDefined()
      expect(typeof tool.name).toBe('string')
      expect(tool.name.length).toBeGreaterThan(0)
      
      expect(tool.description).toBeDefined()
      expect(typeof tool.description).toBe('string')
      expect(tool.description.length).toBeGreaterThan(0)
      
      expect(tool.jsonSchema).toBeDefined()
      expect(typeof tool.jsonSchema).toBe('object')
      
      expect(tool.execute).toBeDefined()
      expect(typeof tool.execute).toBe('function')
    }
  })
})
