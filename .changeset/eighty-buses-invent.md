---
'@graphprotocol/horizon': major
---

Migrated the package to ES modules and Hardhat 3. Solidity unit tests and coverage run through hardhat instead of forge, compilation uses a fast default build profile while deploys keep production settings, secrets are managed with the hardhat keystore instead of hardhat-secure-accounts, and the integration script forks through BLOCKCHAIN_RPC and FORK_BLOCK_NUMBER (archive endpoint required). Local deployments run on Hardhat 3's in-memory default network instead of the hardhat network. Migration step 4 no longer attempts to register the dispute manager in standalone mode.
