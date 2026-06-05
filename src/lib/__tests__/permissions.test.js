import { describe, it, expect } from 'vitest'
import { can, canActForTeam, teamForRole, isApprover, ROLES, TEAMS } from '../permissions'

const admin = { uid: 'a', role: ROLES.ADMIN }
const eng = { uid: 'e', role: ROLES.ENGINEERING }
const ops = { uid: 'o', role: ROLES.OPERATIONS }
const tech = { uid: 't', role: ROLES.TECHNICIAN }

describe('role helpers', () => {
  it('identifies approvers', () => {
    expect(isApprover(ROLES.ADMIN)).toBe(true)
    expect(isApprover(ROLES.ENGINEERING)).toBe(true)
    expect(isApprover(ROLES.OPERATIONS)).toBe(true)
    expect(isApprover(ROLES.TECHNICIAN)).toBe(false)
  })
  it('maps roles to teams', () => {
    expect(teamForRole(ROLES.ENGINEERING)).toBe(TEAMS.ENGINEERING)
    expect(teamForRole(ROLES.OPERATIONS)).toBe(TEAMS.OPERATIONS)
    expect(teamForRole(ROLES.ADMIN)).toBe(null)
  })
})

describe('can()', () => {
  it('everyone approved can create', () => {
    for (const p of [admin, eng, ops, tech]) expect(can(p, 'create')).toBe(true)
  })
  it('only admin manages users / views audit', () => {
    expect(can(admin, 'manageUsers')).toBe(true)
    expect(can(eng, 'manageUsers')).toBe(false)
    expect(can(tech, 'viewAudit')).toBe(false)
  })
  it('technician views only their own permits', () => {
    const own = { createdBy: 't' }
    const other = { createdBy: 'x' }
    expect(can(tech, 'view', own)).toBe(true)
    expect(can(tech, 'view', other)).toBe(false)
    expect(can(eng, 'view', other)).toBe(true)
  })
  it('only approvers decide', () => {
    expect(can(eng, 'decide')).toBe(true)
    expect(can(tech, 'decide')).toBe(false)
  })
  it('owner or approver can request closure/extension', () => {
    const own = { createdBy: 't' }
    expect(can(tech, 'requestClosure', own)).toBe(true)
    expect(can(tech, 'requestExtension', { createdBy: 'x' })).toBe(false)
    expect(can(ops, 'requestClosure', { createdBy: 'x' })).toBe(true)
  })
})

describe('canActForTeam()', () => {
  const unassigned = { assignedEngineer: null, assignedOperator: null }
  it('admin can act for either team', () => {
    expect(canActForTeam(admin, unassigned, TEAMS.ENGINEERING)).toBe(true)
    expect(canActForTeam(admin, unassigned, TEAMS.OPERATIONS)).toBe(true)
  })
  it('engineering acts only on engineering', () => {
    expect(canActForTeam(eng, unassigned, TEAMS.ENGINEERING)).toBe(true)
    expect(canActForTeam(eng, unassigned, TEAMS.OPERATIONS)).toBe(false)
  })
  it('respects a specific assigned approver', () => {
    const assigned = { assignedEngineer: 'e', assignedOperator: 'o' }
    expect(canActForTeam(eng, assigned, TEAMS.ENGINEERING)).toBe(true)
    const otherEng = { uid: 'e2', role: ROLES.ENGINEERING }
    expect(canActForTeam(otherEng, assigned, TEAMS.ENGINEERING)).toBe(false)
    // admin overrides assignment
    expect(canActForTeam(admin, assigned, TEAMS.ENGINEERING)).toBe(true)
  })
  it('technician can never act', () => {
    expect(canActForTeam(tech, unassigned, TEAMS.ENGINEERING)).toBe(false)
  })
})
