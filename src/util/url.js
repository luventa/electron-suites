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
