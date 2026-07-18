import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Anything that can resolve a module specifier to a path or file URL:
 * a CommonJS `require`, an ESM `import.meta`, or a bare resolver function.
 */
export type ModuleResolver =
  | { resolve: (specifier: string) => string | URL }
  | ((specifier: string) => string | URL | undefined)

/**
 * Resolves the absolute path to an address book file relative to an existing file.
 *
 * This function uses the provided module resolver on the provided
 * `existingAddressBookPath` to locate a known file (e.g., an existing address book JSON file).
 * Once located, it returns the absolute path to the desired `addressBookPath`, which is resolved
 * relative to the directory of the existing file.
 *
 * If the existing file cannot be resolved, the function returns `undefined`.
 *
 * This is useful when:
 * - You know the location of one file in a package or module.
 * - You need the path to another file in the same directory (or nearby), whether or not it exists.
 *
 * ## Examples
 *
 * ```ts
 * // Example 1: Resolve a different file in the same folder
 * // Locates: <node_modules>/@graphprotocol/horizon/addresses.json
 * // Returns: <node_modules>/@graphprotocol/horizon/addresses-default.json
 * resolveAddressBook(import.meta, 'addresses.json', 'addresses-default.json')
 * ```
 *
 * ```ts
 * // Example 2: Resolve the same file you use for lookup
 * // Locates and returns: <node_modules>/@graphprotocol/address-book/horizon/addresses.json
 * resolveAddressBook(import.meta, '@graphprotocol/address-book/horizon/addresses.json')
 * ```
 *
 * @param resolver - The module resolver from the calling module, used for resolution relative to the caller.
 *   Accepts a CommonJS `require`, an ESM `import.meta`, or a bare resolver function.
 * @param existingAddressBookPath - A resolvable path to an existing file (relative to the caller), used as an anchor. Defaults to `"addresses.json"`.
 * @param addressBookPath - The path (relative to the anchor's directory) to the file you want returned. Defaults to `"addresses.json"`.
 * @returns The absolute path to the requested file, or `undefined` if the existing file cannot be resolved.
 */
export function resolveAddressBook(
  resolver: ModuleResolver,
  existingAddressBookPath: string = 'addresses.json',
  addressBookPath: string = 'addresses.json',
): string | undefined {
  try {
    const resolvedPath = resolveModulePath(resolver, existingAddressBookPath)
    if (resolvedPath === undefined) {
      return undefined
    }

    const packageRoot = path.dirname(resolvedPath)
    return path.join(packageRoot, addressBookPath)
  } catch (_) {
    return undefined
  }
}

function resolveModulePath(resolver: ModuleResolver, specifier: string): string | undefined {
  const resolved = isResolveFunction(resolver) ? resolver(specifier) : resolver.resolve(specifier)

  if (resolved === undefined) {
    return undefined
  }

  const resolvedPath = String(resolved)
  return resolvedPath.startsWith('file:') ? fileURLToPath(resolvedPath) : resolvedPath
}

function isResolveFunction(resolver: ModuleResolver): resolver is (specifier: string) => string | URL | undefined {
  return typeof resolver === 'function' && !('resolve' in resolver)
}
