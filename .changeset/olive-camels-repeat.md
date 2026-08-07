---
'@graphprotocol/interfaces': minor
---

Migrated the package to ES modules and Hardhat 3. The main entry point and the ethers v6 types are now ESM; the ethers v5 types remain CommonJS. OpenZeppelin contracts became a peer dependency so consumers compiling the published Solidity sources resolve imports against their own OpenZeppelin version.
