/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2024 Digital Bazaar, Inc. All rights reserved.
 */
import { describe, expect, it } from 'vitest'
import { convertTimeStamp } from '../../src/util.js'

describe('util.ts', () => {
  describe('convertTimeStamp', () => {
    it('should interpret as UTC if incorrectly serialized', async () => {
      const actualTimeStamp = '2024-09-03T14:13:10'
      const expectedUTCDateTime = '2024-09-03T14:13:10.000Z'
      const actualDate = convertTimeStamp(actualTimeStamp)
      const actualDateString = actualDate.toISOString()
      expect(actualDateString).toBe(expectedUTCDateTime)
    })
  })
})
