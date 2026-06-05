import { describe, it, expect } from 'vitest'
import {
  requiredDocsFor,
  jsaSuggestionsFor,
  needsFireWatch,
  needsConfinedWatcher,
  missingMandatoryDocs,
} from '../ptwData'

describe('requiredDocsFor', () => {
  it('always includes the General docs (RA + RAMS, both mandatory)', () => {
    const docs = requiredDocsFor('Excavation')
    const keys = docs.map((d) => d.key)
    expect(keys).toContain('risk_assessment')
    expect(keys).toContain('method_statement')
    expect(docs.find((d) => d.key === 'risk_assessment').mandatory).toBe(true)
  })
  it('adds Hot Work documents incl. mandatory fire-risk + gas-test', () => {
    const docs = requiredDocsFor('Hot Work')
    const mandatoryKeys = docs.filter((d) => d.mandatory).map((d) => d.key)
    expect(mandatoryKeys).toEqual(expect.arrayContaining(['fire_risk_assessment', 'gas_test_record']))
  })
  it('Confined Space requires gas test + rescue plan', () => {
    const docs = requiredDocsFor('Confined Space Work')
    const mandatoryKeys = docs.filter((d) => d.mandatory).map((d) => d.key)
    expect(mandatoryKeys).toEqual(expect.arrayContaining(['atmosphere_test', 'rescue_plan']))
  })
  it('Loading/Unloading has its own SDS + spill-plan docs', () => {
    const keys = requiredDocsFor('Loading and Unloading of Hazardous Material').map((d) => d.key)
    expect(keys).toEqual(expect.arrayContaining(['sds', 'spill_plan']))
  })
})

describe('jsaSuggestionsFor', () => {
  it('seeds at least one general row plus work-type rows', () => {
    const rows = jsaSuggestionsFor('Hot Work')
    expect(rows.length).toBeGreaterThan(1)
    expect(rows[0]).toHaveProperty('step')
    expect(rows[0]).toHaveProperty('hazard')
    expect(rows[0]).toHaveProperty('precaution')
  })
  it('returns fresh copies (not shared references)', () => {
    const a = jsaSuggestionsFor('Hot Work')
    a[0].step = 'mutated'
    expect(jsaSuggestionsFor('Hot Work')[0].step).not.toBe('mutated')
  })
})

describe('watcher requirements', () => {
  it('hot work needs a fire watch', () => {
    expect(needsFireWatch('Hot Work')).toBe(true)
    expect(needsFireWatch('Electrical Work')).toBe(false)
  })
  it('confined space needs a watcher', () => {
    expect(needsConfinedWatcher('Confined Space Work')).toBe(true)
    expect(needsConfinedWatcher('Hot Work')).toBe(false)
  })
})

describe('missingMandatoryDocs', () => {
  const required = [
    { key: 'a', label: 'A', mandatory: true },
    { key: 'b', label: 'B', mandatory: false },
    { key: 'c', label: 'C', mandatory: true },
  ]
  it('returns mandatory docs that have no attachment', () => {
    const missing = missingMandatoryDocs(required, ['a'])
    expect(missing.map((d) => d.key)).toEqual(['c'])
  })
  it('returns empty when all mandatory docs attached', () => {
    expect(missingMandatoryDocs(required, ['a', 'c'])).toEqual([])
  })
  it('ignores optional docs', () => {
    const missing = missingMandatoryDocs(required, ['a', 'c'])
    expect(missing.find((d) => d.key === 'b')).toBeUndefined()
  })
})
