import { fileURLToPath } from 'node:url'

import { expect } from 'chai'
import path from 'path'

import type { AddressBookResolutionContext } from '../src/config.js'
import { getAddressBookPath } from '../src/config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filesDir = path.join(__dirname, 'fixtures', 'files')

function makeCtx(overrides: Partial<AddressBookResolutionContext> = {}): AddressBookResolutionContext {
  return {
    networkConfig: undefined,
    graphConfig: undefined,
    graphPath: filesDir,
    ...overrides,
  }
}

describe('getAddressBookPath', function () {
  it('should return undefined if no address book is specified', function () {
    expect(getAddressBookPath('horizon', makeCtx(), {})).to.be.undefined
  })

  it("should throw if the address book file doesn't exist", function () {
    const ctx = makeCtx({ graphConfig: { deployments: { horizon: 'addresses-invalid.json' } } })
    expect(() => getAddressBookPath('horizon', ctx, {})).to.throw(/Address book not found: /)
  })

  it('should resolve relative paths against the graph path', function () {
    const ctx = makeCtx({ graphConfig: { deployments: { horizon: 'addresses-global.json' } } })
    expect(getAddressBookPath('horizon', ctx, {})).to.equal(path.join(filesDir, 'addresses-global.json'))
  })

  it('should use the opts deployments if available', function () {
    const addressBook = getAddressBookPath('horizon', makeCtx(), {
      deployments: { horizon: 'addresses-opt.json' },
    })
    expect(path.basename(addressBook!)).to.equal('addresses-opt.json')
  })

  it('should prefer opts over network and global config', function () {
    const ctx = makeCtx({
      networkConfig: { deployments: { horizon: 'addresses-network.json' } },
      graphConfig: { deployments: { horizon: 'addresses-global.json' } },
    })
    const addressBook = getAddressBookPath('horizon', ctx, {
      deployments: { horizon: 'addresses-opt.json' },
    })
    expect(path.basename(addressBook!)).to.equal('addresses-opt.json')
  })

  it('should use the network config deployments if no opts are given', function () {
    const ctx = makeCtx({ networkConfig: { deployments: { horizon: 'addresses-network.json' } } })
    const addressBook = getAddressBookPath('horizon', ctx, {})
    expect(path.basename(addressBook!)).to.equal('addresses-network.json')
  })

  it('should prefer the network config over the global config', function () {
    const ctx = makeCtx({
      networkConfig: { deployments: { horizon: 'addresses-network.json' } },
      graphConfig: { deployments: { horizon: 'addresses-global.json' } },
    })
    const addressBook = getAddressBookPath('horizon', ctx, {})
    expect(path.basename(addressBook!)).to.equal('addresses-network.json')
  })

  it('should use the global config deployments as a fallback', function () {
    const ctx = makeCtx({ graphConfig: { deployments: { horizon: 'addresses-global.json' } } })
    const addressBook = getAddressBookPath('horizon', ctx, {})
    expect(path.basename(addressBook!)).to.equal('addresses-global.json')
  })
})
