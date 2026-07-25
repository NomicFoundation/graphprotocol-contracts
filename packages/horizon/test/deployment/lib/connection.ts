import { network } from 'hardhat'

// Deployment tests only read from the network, so the deployer account is not
// needed. Hardhat resolves account configuration variables when a connection
// makes its first request — even if nothing is ever signed — so connecting with
// the network's regular config would require DEPLOYER_PRIVATE_KEY to be set.
// Overriding accounts keeps these tests credential-free. Module caching makes
// this a single shared connection across all test files.
export const connection = await network.create({ override: { accounts: [] } })
