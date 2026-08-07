---
'@graphprotocol/contracts': patch
---

Added a package export for the Solidity sources and declared @graphprotocol/interfaces as a dependency with OpenZeppelin contracts as a peer dependency, so consumers compiling the published sources resolve their imports correctly.
