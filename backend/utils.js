import crypto from "crypto";

/**
 * Alias Function to generate SHA-256 Strings
 * from any input String
 * 
 * @param {string} input
 * @returns {String} SHA-256 Hash String
**/
export function Hash_SHA256(input) {
    input = String(input);
    return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Generates a Session ID string for a user on Login
 * if no existing Session ID can be found
 *
 * @returns {String} Session ID String
**/
export function GenerateSID() {
    const epoch = 1702018040260n; // choose your own epoch
    const time = BigInt(Date.now()) - epoch;
    const random = BigInt(crypto.randomInt(1024)); // 10 bits of randomness
    return (time << 10n) | random; // combine
}

/**
 * Generates a signauture string use for session
 * verifying based on the user's IP address
 *
 * @param {string} IP - IP address extracted from web-request
 * @returns {String} Signature String of Length 24
**/
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