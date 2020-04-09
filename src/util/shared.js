import log4js from 'log4js'

const logger = log4js.getLogger('util')

/**
 * Call the handler of an event-handler dict with the given event name.
 * @param {Object} events event-handler dict.
 * @param {String} name event name.
 * @param {Object} context javascript context object.
 */
export function handleEvent (events, name, context) {
  if (!events || !name) return

  const handler = events[name]

  if (!handler) return

  if (!(handler instanceof Function)) {
    logger.warn(`Event handler of ${name} must be a function.`)
    logger.debug('Event handler is:', handler)
    return
  }
  logger.debug('Invoking event handler:', name, 'with context', context)
  handler.apply(context, [...arguments].splice(3))
}

/**
 * Checks if value is an empty object, collection, map, or set.
 * @param {*} value 
 */
export const isEmpty = value => {
  if (value == null || typeof value === 'function' ) {
    return true
  }

  const tag = value.toString()
  if (tag === '[object Map]' || tag === '[object Set]') {
    return !value.size
  }

  if (Array.isArray(value) || 
      typeof value === 'string' ||
      typeof value.splice === 'function' ||
      tag === '[object Arguments]') {
    return !value.length
  }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      return false
    }
  }
  return true
}

/**
 * Checks if value is string.
 * @param {*} value 
 */
export const isString = value => {
  if (value == null) {
    return false
  }

  const tag = typeof value
  return tag === 'string' || (tag === 'object' && !Array.isArray(value) && toString.call(value) === '[object String]')
}

/**
 * Checks if value is plain object.
 * @param {*} value 
 */
export const isPlainObject = value => {
  if (value == null) {
    return false
  }

  const tag =  typeof value
  if (tag !== 'object' || toString.call(value) !== '[object Object]') {
    return false
  }

  if (Object.getPrototypeOf(value) === null) {
    return true
  }

  let proto = value
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }
  return Object.getPrototypeOf(value) === proto
}