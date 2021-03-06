/**
 * Resolve the complete url by the given relative url.
 * @param {String} url the relative url.
 */
export const resolveUrl = url => {
  if (!url || url.includes('://')) {
    return url
  }

  return `${global.__baseUrl}${url}`
}

/**
 * Switch current namespace between different asar resources.
 * @param {String} namespace identifier of the namespace about to switch to.
 * @todo default namespace is considered as 'app' which is hard coded here.
 */
export const switchBaseUrl = namespace => {
  if (global.__dev) {
    global.__baseUrl = namespace === 'app'
      ? `http://localhost:${global.__port}`
      : `file://${global.__root}/${namespace}.asar/dist/index.html`
  } else {
    global.__baseUrl = global.__baseUrl.replace(`${global.__namespace}.asar`, `${namespace}.asar`)
  }
  global.__namespace = namespace
}