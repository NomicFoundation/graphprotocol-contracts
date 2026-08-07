---
'@graphprotocol/interfaces': patch
---

Declared ethers as a peer dependency. The published contract types import it, so consumers that hard-copy the package (for example pnpm injected dependencies) could otherwise resolve a mismatched ethers version and get incorrectly shaped contract types.
