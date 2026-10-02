import './patch.js';
import { compile, createFileManager } from '@noir-lang/noir_wasm';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import * as path from 'path';

async function setup() {
    const circuitPath = path.resolve(__dirname, '../circuits').replace(/\\/g, '/');
    const fm = createFileManager(circuitPath);
    const compiled = await compile(fm);
    if (!('program' in compiled)) {
        throw new Error('Compilation failed: ' + JSON.stringify(compiled));
    }
    const program = compiled.program;
    const backend = new BarretenbergBackend(program);
    const noir = new Noir(program);
    return { noir, backend };
}

async function runTests() {
    console.log("Setting up Noir and compiling circuit...");
    const { noir, backend } = await setup();
    
    // Private inputs
    const originalInput = {
        media_hash: '1234',
        claim_hash: '5678',
        verdict: '1',
        nonce: '91011'
    };

    console.log("\n--- TEST 1: Valid commitment + valid witness ---");
    const { witness: validWitness, returnValue: commitment } = await noir.execute(originalInput);
    const validProof = await backend.generateProof(validWitness);
    const isValid = await backend.verifyProof(validProof);
    console.log("Proof verified successfully:", isValid);

    console.log("\n--- TEST 2: Modified media hash ---");
    try {
        const modifiedInput = { ...originalInput, media_hash: '9999' };
        const { witness: badWitness } = await noir.execute(modifiedInput);
        const badProof = await backend.generateProof(badWitness);
        badProof.publicInputs = validProof.publicInputs;
        const isBadValid = await backend.verifyProof(badProof).catch(() => false);
        console.log("Modified media hash proof verification (should be false):", isBadValid);
    } catch (e) {
        console.log("Modified media hash proof verification failed as expected.");
    }

    console.log("\n--- TEST 3: Modified claim hash ---");
    try {
        const modifiedInput = { ...originalInput, claim_hash: '9999' };
        const { witness: badWitness } = await noir.execute(modifiedInput);
        const badProof = await backend.generateProof(badWitness);
        badProof.publicInputs = validProof.publicInputs;
        const isBadValid = await backend.verifyProof(badProof).catch(() => false);
        console.log("Modified claim hash proof verification (should be false):", isBadValid);
    } catch (e) {
        console.log("Modified claim hash proof verification failed as expected.");
    }

    console.log("\n--- TEST 4: Modified verdict ---");
    try {
        const modifiedInput = { ...originalInput, verdict: '2' };
        const { witness: badWitness } = await noir.execute(modifiedInput);
        const badProof = await backend.generateProof(badWitness);
        badProof.publicInputs = validProof.publicInputs;
        const isBadValid = await backend.verifyProof(badProof).catch(() => false);
        console.log("Modified verdict proof verification (should be false):", isBadValid);
    } catch (e) {
        console.log("Modified verdict proof verification failed as expected.");
    }

    console.log("\n--- TEST 5: Modified commitment ---");
    try {
        const tamperedProof = { ...validProof };
        tamperedProof.publicInputs = ['0x1234567890'];
        const isTamperedValid = await backend.verifyProof(tamperedProof).catch(() => false);
        console.log("Modified commitment proof verification (should be false):", isTamperedValid);
    } catch (e) {
        console.log("Modified commitment proof verification failed as expected.");
    }

    console.log("\n--- TEST 6: Different nonce ---");
    try {
        const modifiedInput = { ...originalInput, nonce: '9999' };
        const { witness: badWitness } = await noir.execute(modifiedInput);
        const badProof = await backend.generateProof(badWitness);
        badProof.publicInputs = validProof.publicInputs;
        const isBadValid = await backend.verifyProof(badProof).catch(() => false);
        console.log("Different nonce proof verification (should be false):", isBadValid);
    } catch (e) {
        console.log("Different nonce proof verification failed as expected.");
    }
    
    console.log("\nAll ZK tests completed.");
    process.exit(0);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
