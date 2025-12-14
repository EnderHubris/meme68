import express from 'express';
import cookieParser from 'cookie-parser';
import cors from "cors";

import { RegisterUser, LoginUser, LogoutUser, VerifySession, IsAdmin } from './userManage.js';
import { CreateAdmin, GetAdmins, RemoveAdmin } from './adminManage.js';

const app = express();
const PORT = 4000;

// try to mitigate from sending response data back to sketchy places
const allowedOrigins = [
    `http://localhost:80`,
    `http://localhost:8080`,
    `http://localhost:5173`,
    `https://localhost:443`
];

console.log(`Allowed Origins\n|____ ${allowedOrigins}\n`);

app.use(cors({
    origin: allowedOrigins,
    credentials: true        // allow cookies
}));

// attempting to cover up digital foot-print
app.disable('x-powered-by');

app.use(express.urlencoded({ extended: true })); // middleware to handle urlencoded data
app.use(express.json()); // middleware to handle JSON data
app.use(cookieParser()); // Access cookies

// Custom Error Handler to minimize verbose output
app.use((err, req, res, next) => {
    console.error(err);
    return res.status(500).text("An unexpected error occurred.");
});

app.get('/', (req, res) => {
    return res.send("THIS IS THE BACKEND!");
});

app.get('/verify_auth', async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);

            if (valid) {
                console.log("Session Verified!");
            } else {
                console.log("Invalid Session!");
            }

            return res.json({
                message: (valid) ? "Session Valid" : "Invalid Session"
            });
        } else {
            return res.json({
                message: "No Existing Session"
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});
app.get('/is_admin', async (req, res) => {
    try {
        console.log("[ADMIN CHECK] Checking if user is ADMIN");
        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            let is_admin = false;
            
            if (valid) {
                console.log("[ADMIN CHECK] Session Verified!");
                console.log("[ADMIN CHECK] Checking Ownership. . .");
                is_admin = await IsAdmin(sessid, IP);
            } else {
                console.log("[ADMIN CHECK] Invalid Session!");
            }

            if (is_admin) {
                console.log("[ADMIN CHECK] User is an ADMIN!");
            } else {
                console.log("[ADMIN CHECK] User is NOT ADMIN!");
            }

            return res.json({
                is_admin: is_admin
            });
        }
        
        console.log("[ADMIN CHECK] User is NOT ADMIN!");
        return res.json({
            is_admin: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});

app.get('/logout', async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        if (sessid) {
            console.log("COOKIE found!");
            const loggedOut = await LogoutUser(sessid);
            res.clearCookie("sessid");
            return res.json({
                message: (loggedOut) ? "Logout Successful" : "Failed to Logout",
                success: (loggedOut)
            });
        } else {
            console.log("No existing COOKIE!");
            return res.json({
                message: "Failed to Logout",
                success: false
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});
app.post('/login', async (req, res) => {
    try {
        const data = req.body; // JSON {name, password}
        const IP = req.ip;

        console.log(`LOGIN -> ${JSON.stringify(data)}`);
        if (!data || !IP)
            return res.json({message:"Failed to Login", success: false});

        if (!data.name || !data.password)
            return res.json({message:"Failed to Login", success: false});

        const sessid = await LoginUser(data.name, data.password, IP);
        console.log(`SESSID -> ${sessid}`);
        if (sessid) {
            res.cookie("sessid", sessid, {
                httpOnly: true,         // mitigate XSS
                secure: true,           // only over HTTPS (set to false on localhost)
                sameSite: "strict",     // prevents CSRF
                maxAge: 1000 * 60 * 60 * 24 * 21 // 3 weeks in ms
            });
        }

        return res.json({
            message: (sessid != null) ? "Login Successfully" : "Failed to Login",
            success: (sessid != null)
        });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});
app.post('/register', async (req, res) => {
    try {
        const data = req.body; // JSON {username, email, password}
        console.log(`REGISTER -> ${JSON.stringify(data)}`);
        if (!data)
            return res.json({message:"Failed to Register", success: false});

        if (!data.username || !data.email || !data.password)
            return res.json({message:"Failed to Register", success: false});

        const addedUser = await RegisterUser(data.username, data.email, data.password);
        return res.json({
            message: addedUser ? "Registered Successfully" : "Failed to Register",
            success: addedUser
        });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});

app.get('/admin/fetch', async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            let is_admin = false;
            
            if (valid) {
                is_admin = await IsAdmin(sessid, IP);
            }

            if (is_admin) {
                console.log("Fetching Admins. . .");
                const admins = await GetAdmins();
                console.log(`Admins -> ${JSON.stringify(admins)}`);
                
                return res.json({ admins: admins });
            } else {
                return res.json({ admins: [] });
            }
        }
        return res.json({ admins: [] });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});
app.post('/admin/create', async (req, res) => {
    try {
        const data = req.body; // JSON {username, email, password}
        if (!data)
            return res.json({message:"Failed to Register", success: false});

        if (!data.username || !data.email || !data.password)
            return res.json({message:"Failed to Register", success: false});

        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            let is_admin = false;
            
            if (valid) {
                is_admin = await IsAdmin(sessid, IP);
            }

            if (is_admin) {
                console.log("New Admin Created!");
                
                const created = await CreateAdmin(data.username, data.email, data.password);
                return res.json({
                    message: created ? "Created Successfully" : "Failed to Create",
                    success: created
                });
            } else {
                console.log(`Non-Admin (${req.ip}) tried creating an Admin Account!`);
                return res.json({
                    message: "Failed to Create",
                    success: false
                });
            }
        }

        return res.json({
            message: "Failed to Create",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});
app.post('/admin/remove', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Failed to Remove", success: false});

        if (!data.username)
            return res.json({message:"Failed to Remove", success: false});

        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            let is_admin = false;
            
            if (valid) {
                is_admin = await IsAdmin(sessid, IP);
            }

            if (is_admin) {
                const removed = await RemoveAdmin(data.username);
                return res.json({
                    message: removed ? "Removed Successfully" : "Failed to Remove",
                    success: removed
                });
            } else {
                return res.json({
                    message: "Failed to Remove",
                    success: false
                });
            }
        }

        return res.json({
            message: "Failed to Remove",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).text("An unexpected error occurred.");
    }
});

app.listen(PORT, () => {
    console.log(`Backend listening at http://localhost:${PORT}`);
});