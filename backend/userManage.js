import { query } from './db.js';
import { Hash_SHA256, GenerateSID, GenerateSignature } from './utils.js';

/**
 * Takes in a user's SESSID cookie and verifies it belongs to them
 * 
 * @param {string} sid - SESSID cookie value
 * @param {string} IP - IP address extracted from web-request
 * @returns {Boolean} Finishes after session validity
**/
export async function VerifySession(sid, IP) {
    const sig = GenerateSignature(IP);
    if (sid && sig) {
        console.log(`Searching for Session with following (sid,sig) -> (${sid},${sig})`);
        const sessData = await query(
            "SELECT sid,uid FROM sessions WHERE (sid = ? AND signature = ?) LIMIT 1",
            [sid, sig]
        );
        return sessData.length > 0;
    }
    return false;
}

/**
 * Takes a user's SESSID cookie and verifies that the SESSID
 * is both theirs AND if the owner of the session is an admin
 * 
 * @param {string} sid - SESSID cookie value
 * @param {string} IP - IP address extracted from web-request
 * @returns {Boolean} Finishes after session validity
**/
export async function IsAdmin(sid, IP) {
    const sig = GenerateSignature(IP);
    if (sid && sig) {
        console.log(`Searching for Session with following (sid,sig) -> (${sid},${sig})`);
        const sessData = await query(
            "SELECT sid,uid FROM sessions WHERE (sid = ? AND signature = ?) LIMIT 1",
            [sid, sig]
        );

        if (sessData.length == 0) return false;
        const data = sessData[0];

        const userData = await query(
            "SELECT username,admin FROM users WHERE id = ?",
            [data.uid]
        );
        // DB treats booleans as: 0 | 1 => false | true
        return userData.length > 0 && (userData[0].admin === 1);
    }
    return false;
}

/**
 * Takes in username|email, password, and IP address to authenticate a user
 * 
 * @param {string} name - username or email
 * @param {string} password - plain-text password
 * @param {string} IP - IP address extracted from web-request
 * @returns {Promise<String|null>} Returns SESSID string if possible, otherwise return null
**/
// user can use username or email with their password to login
export async function LoginUser(name, password, IP) {
    try {
        const password_hash = Hash_SHA256(password);
        const result = await query(
            "SELECT id,username FROM users WHERE (username = ? OR email = ?) and password_hash = ?",
            [name, name, password_hash]
        );
    
        if (result) {
            if (result.length > 0) {
                console.log("User logged in Successfully");
                const sess = await GetSession(result[0], IP);
                return sess.sid;
            } else {
                console.log("Failed to Login User");
                return null;
            }
        } else {
            console.error("Login Query Failed");
            return null;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

/**
 * Takes in user data from the database and the IP of the user to create a new session
 * 
 * @param {{id: number, username: string}} user - username or email
 * @param {string} IP - IP address extracted from web-request
 * @returns {JSON} Returns session JSON if possible, otherwise return null
**/
async function CreateSession(user, IP) {
    try {
        const sid = GenerateSID();
        const sig = GenerateSignature(IP);

        if (!sig) {
            console.error("Error Occured generating session signature!");
            return null;
        }

        const result = await query(
            "INSERT INTO sessions (sid,uid,signature) VALUES (?, ?, ?)",
            [sid, user.id, sig]
        );
    
        if (result) {
            if (result.affectedRows === 1) {
                console.log("New Session Created!");
    
                const sessData = await query(
                    "SELECT sid, created_at, expires_at FROM sessions WHERE sid = ? AND signature = ? LIMIT 1",
                    [sid, sig]
                );

                const data = sessData[0];
    
                const sess = {
                    sid: data.sid,
                    sig: sig,
                    created_at: data.created_at,
                    expires_at: data.expires_at
                };
                return sess;
            } else {
                console.log("Failed to Create new Session");
                return null;
            }
        } else {
            console.error("Insertion Query Failed");
            return null;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

/**
 * Checks if a session has expired, returns session if not expired OR removes the
 * expired session from the database to replace it with a new session
 * 
 * @param { {sid: string, sig: string, created_at: any, expires_at: any } } sess - Session Data JSON
 * @param {string} IP - IP address extracted from web-request
 * @returns {JSON|null} Returns session JSON if possible, otherwise return null
**/
async function CheckSession(sess, IP) {
    try {
        if (!sess) return;
    
        if (Date.now() >= sess.expires_at) {
            // delete expired session from database
            const result = await query(
                "DELETE FROM sessions WHERE sid = ? AND signature = ?",
                [sess.sid, sess.sig]
            );
            if (result) {
                // create a new session for the user
                const rows = await query(
                    "SELECT id,username FROM users WHERE id = ?",
                    [sess.uid]
                );
                if (rows.length > 0) {
                    const user = rows[0];
                    const sess = await CreateSession(user, IP);
                    return sess;
                } else {
                    console.error(`Failed to find user with UID = ${sess.uid}`);
                    return null;
                }
            } else {
                console.error("Delete Query Failed");
                return null;
            }
        }
    
        return sess;
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

/**
 * Given a session id logout the user and delete their session form the database
 * 
 * @param {string} sid - SESSID cookie value
 * @returns {Promise<boolean>} Returns if the logout was successful
**/
export async function LogoutUser(sid) {
    return await DeleteSession(sid);
}

/**
 * Given a session id delete the session from the database
 * 
 * @param {string} sid - session id we want to remove
 * @returns {boolean} Returns whether the session deletion was successful
**/
async function DeleteSession(sid) {
    const result = await query(
        "DELETE FROM sessions WHERE sid = ?",
        [sid]
    );
    if (result) {
        return true;
    } else {
        console.error("Delete Query Failed");
        return false;
    }
}

/**
 * Given user's basic info and their IP query the database to find their session if once exists
 * if a session cannot be found we create a new session and return it
 * 
 * @param {{id: number, username: string}} user - JSON blob with user-id and username
 * @param {string} IP - IP address extracted from web-request
 * @returns {JSON | null} Returns session JSON or null if a session cannot be found
**/
async function GetSession(user, IP) {
    try {
        // check if user has a session in the DB
        const rows = await query(
            "SELECT sid, created_at, expires_at, signature FROM sessions WHERE uid = (SELECT id FROM users WHERE username = ?)",
            [user.username]
        );
        if (rows.length > 0) {
            // grab stored session
            const data = rows[0];
    
            let sess = {
                sid: data.sid,
                sig: data.signature,
                created_at: data.created_at,
                expires_at: data.expires_at
            };
            sess = await CheckSession(sess, IP);
    
            console.log("FOUND PREVIOUS SESS:");
            console.log(sess);
            return sess;
        } else {
            // create new session
            const sess = await CreateSession(user, IP);
            console.log("NEWLY CREATED SESS:");
            console.log(sess);
            return sess;
        }
    } catch (err) {
        console.error(`Error: ${err}`);
        return null;
    }
}

/**
 * Takes in username, email, and plain-text password to attempt creating a new user-account
 * 
 * @param {string} username - username
 * @param {string} email - email
 * @param {string} password - plain-text password
 * @returns {Promise<boolean>} Returns if the user was successfully created in the database
**/
export async function RegisterUser(username, email, password) {
    try {
        if (await UserExists(username, email)) {
            console.log(`User: ${username} already exists!`);
            return false;
        }

        const password_hash = Hash_SHA256(password);
        const result = await query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, password_hash]
        );
    
        if (result) {
            if (result.affectedRows === 1)
                console.log("User Registered Successfully");
            else
                console.log("Failed to Register User");
        } else {
            console.error("Insertion Query Failed");
        }
    
        return result && result.affectedRows === 1;
    } catch (err) {
        console.error(`Error: ${err}`);
        return false;
    }
}

/**
 * Determine if a user already exists by checking if a username or email is taken
 * 
 * @param {string} username - username
 * @param {string} email - email
 * @returns {Promise<boolean>} Returns if a user exists
**/
export async function UserExists(username, email) {
    try {
        const rows = await query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );
        return rows.length > 0;
    } catch (err) {
        // for safety assume user exists
        console.error(`Error: ${err}`);
        return true;
    }
}