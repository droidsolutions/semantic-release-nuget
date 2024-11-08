/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * Custom resolver to help Jest with .mjs files that Jests TypeScript handling generates from mts.
 * @param {string} path The path to the file to resolve.
 * @param {*} options Any options to help resolving.
 * @param {(string, object) => string} options.defaultResolver Any options to help resolving.
 * @returns The resolved file or undefined.
 */
const mjsResolver = (path, options) => {
  const mjsExtRegex = /\.mjs$/i;
  const resolver = options.defaultResolver;
  if (mjsExtRegex.test(path)) {
    try {
      return resolver(path.replace(mjsExtRegex, ".mts"), options);
    } catch {
      // use default resolver
    }
  }

  return resolver(path, options);
};

// eslint-disable-next-line no-undef
module.exports = mjsResolver;
