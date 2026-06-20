import express from 'express';
import cookieParser from 'cookie-parser';
import cors from "cors";

import {
    RegisterUser, LoginUser, LogoutUser, VerifySession,
    IsAdmin, GetEnjoyers, GetLikedMemes, GetUsername
} from './userManage.js';

import { CreateAdmin, GetAdmins, RemoveAdmin } from './adminManage.js';
import {
    UploadMeme, DeleteMeme, GetMemes, GetRecentMemes,
    LikedMeme, DislikeMeme, GetMemeInfo, EditMeme,
    GetMemeOfTheDay, UpdateMemeOfTheDay
} from './memeManage.js';

const app = express();
const PORT = 4000;

import multer from "multer";
import { fileTypeFromFile } from "file-type";
import fs from "fs";
import path from "path";
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads/";

// try to mitigate from sending response data back to sketchy places
const allowedOrigins = [
    `http://localhost:80`,
    `http://localhost:8080`,
    `http://localhost:5173`,
    `https://localhost:443`,
    process.env.DEV_HOST ?? "",
    process.env.DEV_BACK_HOST ?? "",
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
    return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
    }
});
app.post('/login', async (req, res) => {
    try {
        const data = req.body; // JSON {name, password}
        const IP = req.ip;

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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
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
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.get('/admin/get_enjoyers', async (req, res) => {
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
                const enjoyers = await GetEnjoyers();
                return res.json({ enjoyers: enjoyers });
            } else {
                return res.json({ enjoyers: [] });
            }
        }
        return res.json({ enjoyers: [] });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.get('/get_memes', async (req, res) => {
    try {
        const memes = await GetMemes();
        return res.json({ memes: memes });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});
app.get('/get_recent_memes', async (req, res) => {
    try {
        const memes = await GetRecentMemes();
        return res.json({ memes: memes });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});
app.get('/get_liked_memes', async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            if (valid) {
                const liked_memes = await GetLikedMemes(sessid);
                console.log(`LIKED_MEMES -> ${JSON.stringify(liked_memes)}`);
                return res.json({ liked_memes: liked_memes });
            }
        }
        return res.json({ liked_memes: [] });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.post('/admin/remove_meme', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Failed to Remove", success: false});

        if (!data.mid)
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
                const removed = await DeleteMeme(data.mid);
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
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.post('/admin/edit_meme', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Failed to Edit", success: false});
        if (!data.mid)
            return res.json({message:"Failed to Edit", success: false});
        if (!data.newTagString)
            return res.json({message:"Failed to Edit", success: false});

        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            let is_admin = false;
            
            if (valid) {
                is_admin = await IsAdmin(sessid, IP);
            }

            if (is_admin) {
                const editted = await EditMeme(data.mid, data.newTagString);
                return res.json({
                    message: editted ? "Editted Successfully" : "Failed to Edit",
                    success: editted
                });
            } else {
                return res.json({
                    message: "Failed to Edit",
                    success: false
                });
            }
        }

        return res.json({
            message: "Failed to Edit",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.get('/admin/force_update_motd', async (req, res) => {
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
                console.log("[*] Admin Forcibly Updating MOTD");

                const motd_old = await GetMemeOfTheDay();
                await UpdateMemeOfTheDay(true);
                const motd_new = await GetMemeOfTheDay();

                console.log(`[*] MOTD: ${motd_old.mid} -> ${motd_new.mid}`);

                const h = motd_old.mid !== motd_new.mid;

                return res.json({
                    message: h ? "Successfully Updated MOTD" : "Failed to Update MOTD",
                    success: h
                });
            } else {
                return res.json({
                    message: "Failed to Update MOTD",
                    success: false
                });
            }
        }

        return res.json({
            message: "Failed to Update MOTD",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.post('/like_meme', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Need an Account to use this feature", success: false});

        if (!data.mid)
            return res.json({message:"Need an Account to use this feature", success: false});

        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            if (valid) {
                const likeApplied = await LikedMeme(sessid, data.mid);
                return res.json({
                    message: likeApplied ? "Meme Liked" : "Error Occurred",
                    success: likeApplied
                });
            }
        }

        return res.json({
            message: "Need an Account to use this feature",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.post('/dislike_meme', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Need an Account to use this feature", success: false});

        if (!data.mid)
            return res.json({message:"Need an Account to use this feature", success: false});

        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            if (valid) {
                const dislikeApplied = await DislikeMeme(sessid, data.mid);
                return res.json({
                    message: dislikeApplied ? "Meme Disliked" : "Error Occurred",
                    success: dislikeApplied
                });
            }
        }

        return res.json({
            message: "Need an Account to use this feature",
            success: false
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.post('/get_meme_info', async (req, res) => {
    try {
        const data = req.body;
        if (!data)
            return res.json({message:"Bad Data", success: false});

        if (!data.mid)
            return res.json({message:"Missing meme id parameter", success: false});

        const memeData = await GetMemeInfo(data.mid);

        return res.json({
            mid: memeData.mid,
            file_ext: memeData.file_ext,
            tagString: memeData.tagString,
            likes: memeData.likes,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.get('/say_my_name', async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        const IP = req.ip;
        if (sessid) {
            const valid = await VerifySession(sessid,IP);
            if (valid) {
                const username = await GetUsername(sessid);
                return res.json({ username: username });
            }
        }
        return res.json({ username: "Account" });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.get('/meme_of_the_day', async (req, res) => {
    try {
        let data = await GetMemeOfTheDay();

        console.log(`[*] MEME OF THE DAY -> ${JSON.stringify({
            mid: data.mid,
            file_ext: data.file_ext,
            tagString: data.tagString,
            likes: data.likes
        })}`);

        // update meme of the day if the entry is
        // potentially corrupted
        if (data.mid.length === 0) {
            await UpdateMemeOfTheDay(false);
            data = await GetMemeOfTheDay();
        }

        return res.json({
            mid: data.mid,
            file_ext: data.file_ext,
            tagString: data.tagString,
            likes: data.likes
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

//####################################################################################

import { randomBytes } from 'crypto';

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg"
];

// hash the name but preserve the ext
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const randomName = randomBytes(16).toString("hex");
        cb(null, `${randomName}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter(req, file, cb) {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new Error("Invalid file type"), false);
        }
        cb(null, true);
    }
});

app.post("/upload", upload.array("files", 10), async (req, res) => {
    try {
        const sessid = req.cookies.sessid;
        const IP = req.ip;

        if (!sessid) {
            cleanup(req.files);
            return res.json({ success: false });
        }

        const valid = await VerifySession(sessid, IP);
        if (!valid || !(await IsAdmin(sessid, IP))) {
            cleanup(req.files);
            return res.json({ success: false });
        }

        let i = 0;
        let uploadCount = 0;
        for (const file of req.files) {
            const type = await fileTypeFromFile(file.path);

            if (!type || !ALLOWED_TYPES.includes(type.mime)) {
                fs.unlinkSync(file.path);
                return res.json({ error: "Invalid file content" });
            }

            console.log("[*] Uploading:", file.filename);

            const tags = req.body.tags[i];
            const uploaded = await UploadMeme(file.filename, tags);
            if (uploaded) ++uploadCount;

            ++i;
        }

        return res.json({ uploadCount: uploadCount, success: true });
    } catch (err) {
        console.error(err);
        cleanup(req.files);
        return res.status(500).send("An unexpected error occurred.");
    }
});

function cleanup(files = []) {
    for (const file of files) {
        try {
            fs.unlinkSync(file.path);
        } catch (err) {
            console.error(err);
        }
    }
}

app.get('/uploads/:filename', (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename (no ../, only safe chars)
        if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
            return res.status(400).send("Invalid Input");
        }

        const filePath = path.resolve(UPLOAD_DIR, filename);
        const uploadsDir = path.resolve(UPLOAD_DIR);

        if (!filePath.startsWith(uploadsDir)) {
            return res.status(400).send("Invalid Input");
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found");
        }

        return res.sendFile(filePath, (err) => {
            if (err) {
                console.error(err);
                return res.status(err.status || 500).send("Error sending file");
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred.");
    }
});

app.listen(PORT, () => {
    console.log(`Backend listening at http://localhost:${PORT}`);
});

// Period execution to update Meme of the Day
let checking = false;
async function UpdateDB() {
    if (checking) return;
    checking = true;
    
    await UpdateMemeOfTheDay(true);

    checking = false;
}

// initial update on start-up
await UpdateDB();

// Run every 60 seconds (60000 ms)
setInterval(UpdateDB, 60 * 1000);