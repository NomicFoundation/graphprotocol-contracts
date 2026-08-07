---
'@graphprotocol/subgraph-service': patch
---

Migrated the package to ES modules and Hardhat 3. Solidity unit tests and coverage run through hardhat instead of forge, compilation uses a fast default build profile while deploys keep production settings, secrets are managed with the hardhat keystore instead of hardhat-secure-accounts, and the integration script forks through BLOCKCHAIN_RPC and FORK_BLOCK_NUMBER (archive endpoint required). Local deployments run on Hardhat 3's in-memory default network instead of the hardhat network. The deploy:migrate task now patches the recurring collector address from the horizon address book, and the test seed no longer closes legacy allocations, which horizon staking no longer supports nor requires.
