import { describe, it, expect } from 'vitest'
import {
  derivePermitStatus,
  dashboardBuckets,
  computeWindow,
  bothApproved,
  extensionApproved,
  STATUS,
  PERMIT_WINDOW_MS,
} from '../permitStatus'

const approved = { status: 'approved' }
const pending = { status: 'pending' }
const rejected = { status: 'rejected' }

// Build a permit whose window starts at `startMs` and runs 8h.
function permit(overrides = {}, startMs = Date.parse('2026-06-05T09:00:00.000Z')) {
  return {
    engineering: pending,
    operations: pending,
    closure: null,
    extension: null,
    validFrom: new Date(startMs).toISOString(),
    validTo: new Date(startMs + PERMIT_WINDOW_MS).toISOString(),
    ...overrides,
  }
}

describe('computeWindow', () => {
  it('builds an 8-hour window from date + time', () => {
    const { validFrom, validTo } = computeWindow('2026-06-05', '09:00')
    expect(Date.parse(validTo) - Date.parse(validFrom)).toBe(PERMIT_WINDOW_MS)
  })
  it('returns nulls for invalid input', () => {
    expect(computeWindow('', '')).toEqual({ validFrom: null, validTo: null })
  })
})

describe('bothApproved / extensionApproved', () => {
  it('requires both teams', () => {
    expect(bothApproved(permit({ engineering: approved, operations: pending }))).toBe(false)
    expect(bothApproved(permit({ engineering: approved, operations: approved }))).toBe(true)
  })
  it('extension needs both teams', () => {
    const ext = { engineering: approved, operations: approved, newValidTo: '2026-06-05T20:00:00.000Z' }
    expect(extensionApproved(permit({ extension: ext }))).toBe(true)
    expect(extensionApproved(permit({ extension: { ...ext, operations: pending } }))).toBe(false)
  })
})

describe('derivePermitStatus', () => {
  const start = Date.parse('2026-06-05T09:00:00.000Z')

  it('is Draft when not both-approved', () => {
    expect(derivePermitStatus(permit({ engineering: approved }), start + 1000)).toBe(STATUS.DRAFT)
  })

  it('is Draft when a team rejected', () => {
    expect(derivePermitStatus(permit({ engineering: approved, operations: rejected }), start + 1000)).toBe(STATUS.DRAFT)
  })

  it('is In Progress as soon as both teams approve (open within the timeline)', () => {
    const p = permit({ engineering: approved, operations: approved }, start)
    // Even just before the entered start time, an open/approved permit reads In Progress.
    expect(derivePermitStatus(p, start - 60_000)).toBe(STATUS.IN_PROGRESS)
  })

  it('is In Progress within the window', () => {
    const p = permit({ engineering: approved, operations: approved }, start)
    expect(derivePermitStatus(p, start + 60_000)).toBe(STATUS.IN_PROGRESS)
  })

  it('is Not Closed once 8h elapses', () => {
    const p = permit({ engineering: approved, operations: approved }, start)
    expect(derivePermitStatus(p, start + PERMIT_WINDOW_MS + 1)).toBe(STATUS.NOT_CLOSED)
  })

  it('is Extended & In Progress after an approved extension keeps it live', () => {
    const newEnd = start + PERMIT_WINDOW_MS + 4 * 60 * 60 * 1000
    const p = permit({
      engineering: approved, operations: approved,
      extension: { engineering: approved, operations: approved, newValidTo: new Date(newEnd).toISOString() },
    }, start)
    // After the original 8h but before the extended end → still running.
    expect(derivePermitStatus(p, start + PERMIT_WINDOW_MS + 1000)).toBe(STATUS.EXTENDED_IN_PROGRESS)
    // Past the extended end → Not Closed.
    expect(derivePermitStatus(p, newEnd + 1000)).toBe(STATUS.NOT_CLOSED)
  })

  it('is Closed when closure approved by both teams', () => {
    const p = permit({
      engineering: approved, operations: approved,
      closure: { engineering: approved, operations: approved },
    }, start)
    expect(derivePermitStatus(p, start + 1000)).toBe(STATUS.CLOSED)
  })

  it('an unsafe observation forces Closed — Non-Compliance, overriding everything', () => {
    const p = permit({
      engineering: approved, operations: approved,
      closure: { engineering: approved, operations: approved },
      closedDueToObservation: { byName: 'Sam', at: new Date(start).toISOString(), note: 'no harness' },
    }, start)
    expect(derivePermitStatus(p, start + 1000)).toBe(STATUS.CLOSED_NONCOMPLIANCE)
  })
})

describe('dashboardBuckets', () => {
  const start = Date.parse('2026-06-05T09:00:00.000Z')
  it('tallies the five headline buckets', () => {
    const list = [
      permit({ engineering: pending, operations: pending }),                                  // open (draft)
      permit({ engineering: approved, operations: approved }, start),                          // in progress @ now=start+1
      permit({ engineering: approved, operations: approved, closure: { engineering: approved, operations: approved } }), // closed
      permit({ engineering: approved, operations: approved }, start - PERMIT_WINDOW_MS - 1000), // not closed
    ]
    const b = dashboardBuckets(list, start + 1000)
    expect(b.open).toBe(1)
    expect(b.inProgress).toBe(1)
    expect(b.closed).toBe(1)
    expect(b.notClosed).toBe(1)
  })

  it('counts non-compliance closures under the closed bucket', () => {
    const list = [
      permit({ engineering: approved, operations: approved, closure: { engineering: approved, operations: approved } }),
      permit({ closedDueToObservation: { byName: 'Sam' } }),
    ]
    expect(dashboardBuckets(list, start + 1000).closed).toBe(2)
  })

  it('counts an extended running permit ONLY under extended (not in progress)', () => {
    const newEnd = start + PERMIT_WINDOW_MS + 4 * 60 * 60 * 1000
    const p = permit({
      engineering: approved, operations: approved,
      extension: { engineering: approved, operations: approved, newValidTo: new Date(newEnd).toISOString() },
    }, start)
    const b = dashboardBuckets([p], start + PERMIT_WINDOW_MS + 1000) // past original window, within extension
    expect(b.extended).toBe(1)
    expect(b.inProgress).toBe(0)
  })

  it('counts a rejected permit under rejected, not open', () => {
    const b = dashboardBuckets([permit({ engineering: approved, operations: rejected })], start)
    expect(b.rejected).toBe(1)
    expect(b.open).toBe(0)
  })

  it('segregates Not Closed into extended vs never-extended', () => {
    // Expired, never extended.
    const plain = permit({ engineering: approved, operations: approved }, start - PERMIT_WINDOW_MS - 1000)
    // Expired even after an approved extension (extended end still in the past).
    const extended = permit({
      engineering: approved, operations: approved,
      extension: { engineering: approved, operations: approved, newValidTo: new Date(start - 1000).toISOString() },
    }, start - PERMIT_WINDOW_MS - 5000)
    const b = dashboardBuckets([plain, extended], start)
    expect(b.notClosed).toBe(2)
    expect(b.notClosedExtended).toBe(1)
    expect(b.notClosedPlain).toBe(1)
  })
})
