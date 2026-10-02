import './patch.js';
import { compile, createFileManager } from '@noir-lang/noir_wasm';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import * as path from 'path';

export async function verifyProof(proofHex: string, commitment: string) {
    const circuitPath = path.resolve(__dirname, '../circuits').replace(/\\/g, '/');
    const fm = createFileManager(circuitPath);
    const compiled = await compile(fm);
    if (!('program' in compiled)) {
        throw new Error('Compilation failed');
    }
    const program = compiled.program;
    const backend = new BarretenbergBackend(program);
    
    // The verifyProof function takes a ProofData object { proof: Uint8Array, publicInputs: string[] }
    // Our public input is the commitment
    const proofData = {
        proof: new Uint8Array(Buffer.from(proofHex, 'hex')),
        publicInputs: [commitment]
    };
    
    return await backend.verifyProof(proofData).catch(() => false);
}

// Support CLI execution
if (require.main === module) {
    const [proofHex, commitment] = process.argv.slice(2);
    if (!proofHex || !commitment) {
        console.error("Usage: tsx verify.ts <proof_hex> <commitment>");
        process.exit(1);
    }
    verifyProof(proofHex, commitment).then(isValid => {
        console.log("Valid:", isValid);
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
}
