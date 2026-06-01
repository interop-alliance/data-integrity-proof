/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */

/**
 * Converts the given date into W3C datetime format (eg: 2011-03-09T21:55:41Z).
 *
 * @param date {Date|number|string} - The date to convert.
 *
 * @returns {string} The date in W3C datetime format.
 */
export function w3cDate(date?: Date | number | string | null): string {
  let value: Date
  if (date === undefined || date === null) {
    value = new Date()
  } else if (typeof date === 'number' || typeof date === 'string') {
    value = new Date(date)
  } else {
    value = date
  }
  const str = value.toISOString()
  return str.slice(0, -5) + 'Z'
}

export const timezoneOffset = /(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/

// Z and T must be uppercase
// xml schema date time RegExp
// @see https://www.w3.org/TR/xmlschema11-2/#dateTime
export const XMLDateTimeRegExp =
  /-?([1-9][0-9]{3,}|0[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T(([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.[0-9]+)?|(24:00:00(\.0+)?))(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))?/

export function isW3cDate(timeStamp: string): boolean {
  return XMLDateTimeRegExp.test(timeStamp)
}

export function convertTimeStamp(timestamp: string): Date {
  if (!timestamp) {
    throw new Error(`Unexpected timestamp ("${timestamp}") received.`)
  }
  if (!timezoneOffset.test(timestamp)) {
    return new Date(`${timestamp}Z`)
  }
  return new Date(timestamp)
}

/**
 * Concatenates two Uint8Arrays.
 *
 * @param b1 {Uint8Array} - The first buffer to concat.
 * @param b2 {Uint8Array} - The second buffer to concat.
 *
 * @returns {Uint8Array} The result.
 */
export function concat(b1: Uint8Array, b2: Uint8Array): Uint8Array {
  const rval = new Uint8Array(b1.length + b2.length)
  rval.set(b1, 0)
  rval.set(b2, b1.length)
  return rval
}
