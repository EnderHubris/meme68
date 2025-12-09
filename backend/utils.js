import crypto from "crypto";

export function Hash_SHA256(input) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

export function GenerateSID() {
    const epoch = 1702018040260n; // choose your own epoch
    const time = BigInt(Date.now()) - epoch;
    const random = BigInt(crypto.randomInt(1024)); // 10 bits of randomness
    return (time << 10n) | random; // combine
}

export function GenerateSignature(IP) {
    if (!IP) return null;
    IP = String(IP);
    
    let newSig = "";
    const SIGSET = "qazedctgbujmpo1234iuhgfdxzq567wedfghnm890";
    const L = IP.length;

    while (newSig.length < 24) {
        let j = 0;
        for (let i = 0; i < L; ++i) {
            j = ++j % SIGSET.length;
    
            const a = IP[i] ^ SIGSET[j];
            const b = 97 + (a % 26);
    
            newSig += String.fromCharCode(b);
            for (let k = 0; k < 3; ++k) {
                newSig += SIGSET[(a+k) % SIGSET.length];
            }
        }
    }

    return newSig.substring(0,24);
}