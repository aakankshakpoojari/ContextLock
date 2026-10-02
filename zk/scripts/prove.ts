import './patch.js';
import { compile, createFileManager } from '@noir-lang/noir_wasm';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import * as path from 'path';

export async function generateProof(media_hash: string, claim_hash: string, verdict: string, nonce: string) {
    const circuitPath = path.resolve(__dirname, '../circuits').replace(/\\/g, '/');
    const fm = createFileManager(circuitPath);
    const compiled = await compile(fm);
    if (!('program' in compiled)) {
        throw new Error('Compilation failed: ' + JSON.stringify(compiled));
    }
    const program = compiled.program;
    const backend = new BarretenbergBackend(program);
    const noir = new Noir(program);
    
    const input = { media_hash, claim_hash, verdict, nonce };
    const { witness, returnValue } = await noir.execute(input);
    const proof = await backend.generateProof(witness);
    
    // Return proof as hex string (or base64) and the commitment
    return {
        proof: Buffer.from(proof.proof).toString('hex'),
        commitment: returnValue
    };
}

// Support CLI execution
if (require.main === module) {
    const [media_hash = '1', claim_hash = '2', verdict = '3', nonce = '4'] = process.argv.slice(2);
    generateProof(media_hash, claim_hash, verdict, nonce).then(res => {
        console.log(JSON.stringify(res, null, 2));
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
}
