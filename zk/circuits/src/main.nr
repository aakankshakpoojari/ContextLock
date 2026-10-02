fn main(media_hash: Field, claim_hash: Field, verdict: Field, nonce: Field) -> pub Field {
    std::hash::pedersen_hash([media_hash, claim_hash, verdict, nonce])
}
