---
'@graphprotocol/toolshed': major
---

Migrated the package to ES modules and Hardhat 3. The shared hardhat base config now targets Hardhat 3: networks declare their type, the etherscan key and the live network deployer key resolve through configuration variables (hardhat keystore or environment), and secure-accounts support was removed. The `hardhat` network was replaced by Hardhat 3's `default` and `node` networks, which carry the protocol mnemonic so bare `hardhat node` and in-process runs derive the conventional role accounts. Address book resolution accepts a CommonJS require, an ESM import.meta or a resolver function.
