# ContextLock ZK-SNARK Verification Module

This module implements the Zero-Knowledge component of ContextLock using Noir and Barretenberg.

## Architecture

The ContextLock Zero-Knowledge verification layer sits _after_ the normal evidence and AI analysis pipeline. It provides cryptographic privacy by proving knowledge of the original inputs (media hash, claim hash) and tying them to a public commitment, without revealing those inputs publicly.

### Proof Statement (V2)
```
Hash(media_hash, claim_hash, verdict, nonce) == commitment
```
**Inputs:**
- `media_hash` (private field): Hash of the original media specimen.
- `claim_hash` (private field): Hash of the claim narrative.
- `verdict` (private field): The outcome of the verification (e.g. supported, contradicted).
- `nonce` (private field): Randomness used to prevent preimage attacks.

**Outputs / Public Inputs:**
- `commitment` (public field): A Pedersen hash representing the verified ContextLock session.

### Why Zero-Knowledge?

By using a SNARK, a publisher or verifier can generate a `commitment` that gets attached to a piece of media. The verification receipt only contains:
- `commitment`
- `proof`
- `verdict`
- `proof status`

Anyone can verify the proof to ensure that the server or investigator generated a valid verification using the exact media and claim, **without** the public needing access to the original private media or claim text. 
This protects the private identity, sensitive media, or unreleased context, while still establishing that the ContextLock verification pipeline processed it correctly.

## Installation

The dependencies are managed in the main `package.json` utilizing Noir JS packages:
- `@noir-lang/noir_js` 
- `@noir-lang/noir_wasm` 
- `@noir-lang/backend_barretenberg` 

_Note: We use v0.36.0 for stability and compatibility between the compiler and the backend prover._

## Usage

### 1. Circuit Development

The circuit is written in Noir and located at `circuits/src/main.nr`. It natively compiles down to ACIR, which is proven using the Barretenberg WASM backend.

### 2. Generating a Proof

You can generate a proof dynamically from the application by importing `generateProof`:

```typescript
import { generateProof } from './zk/scripts/prove';

const { proof, commitment } = await generateProof(media_hash, claim_hash, verdict, nonce);
```

Or run it manually:
```bash
npx tsx zk/scripts/prove.ts <media_hash> <claim_hash> <verdict> <nonce>
```

### 3. Verifying a Proof

The verification can be done purely with public inputs:

```typescript
import { verifyProof } from './zk/scripts/verify';

const isValid = await verifyProof(proofHex, commitment);
```

Or manually:
```bash
npx tsx zk/scripts/verify.ts <proofHex> <commitment>
```

## Running Tests

To run the full suite of ZK constraint and tampering tests (which ensures modified witnesses and tampered commitments fail to verify):

```bash
npx tsx zk/scripts/test.ts
```
