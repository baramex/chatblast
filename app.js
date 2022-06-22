/* constantes */
const FIELD_REGEX = /^[a-z]{1,32}$/;
const USERNAMES_NOT_ALLOWED = ["system"];

/* modules */
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const path = require("path");
const { Profile } = require("./models/profile.model");
const { Session } = require("./models/session.model");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "/avatars", limits: "0.5mb" });
const { Message } = require("./models/message.model");
const { app, io } = require("./server");
require("dotenv").config();
mongoose.connect(process.env.DB, { dbName: process.env.DB_NAME });

io.on("connection", (socket) => {
    var token = socket.handshake.headers.cookie?.split("; ")?.find(a => a.startsWith("token="))?.replace("token=", "");
    if (token) {
        var profile = Profile.getProfileByToken(token);
        if (profile) {
            socket.profileId = profile.id;
            socket.join(["authenticated", "profileid:" + profile.id.toString()]);
        }
    }

    socket.on("disconnect", () => {
        var profileId = socket.profileId;
        if (!profileId) return;
        var profile = Profile.getProfileByID(profileId);

        if (!profile) return;
        if (profile.isTyping) {
            profile.isTyping = false;
            io.to("authenticated").emit("message.typing", { isTyping: false, username: profile.username });
        }
    });
});

/* routes */
app.get("/", async (req, res) => {
    var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
    if (!session) return res.redirect("/login");
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/login", async (req, res) => {
    var session_ = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
    if (session_) return res.redirect("/");
    res.sendFile(path.join(__dirname, "pages", "login.html"));
});

app.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "terms.html"));
});

app.get("/register", async (req, res) => {
    var session_ = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
    if (session_) return res.redirect("/");
    res.sendFile(path.join(__dirname, "pages", "register.html"));
});

// fonctionne
app.get("/profile/:id/avatar", async (req, res) => {
    try {
        var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (!session) return res.sendStatus(401);
        var profileId = req.params.id == "@me" ? session.profileId : new ObjectId(req.params.id);
        var profile = await Profile.getProfileById(profileId);
        console.log(profile)
        if (!profile.avatar.flag || !profile.avatar.extention) return res.sendFile(__dirname + "/ressources/images/user.png");
        res.sendFile(path.join(__dirname, "avatars", profile.avatar.flag + profile.avatar.extention));
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

/* api */

// utilisateurs en ligne fonctionne pas => revoir car rien touché
app.get("/api/profiles/online", async (req, res) => {
    var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
    if (!session) return res.sendStatus(401);
    res.sendStatus(200);
    // res.status(200).send(Profile.profiles.map(a => a.username, a.id));
});

// récupérer profil
app.get("/api/profile/@me", async (req, res) => {
    var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
    if (!profile) return res.sendStatus(401);

    res.status(200).send({ username: profile.username, id: profile.id, unread: await Message.getUnreadCount(profile) });
});

// upload avatar fonctionne
app.put("/api/profile/@me/avatar", upload.single("avatar"), async (req, res) => {
    try {
        const flag = generateID(15)
        const tempPath = req.file.path;
        const extention = path.extname(req.file.originalname).toLowerCase()
        const targetPath = path.join(__dirname, "avatars", flag + extention);
        var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (req.file.mimetype.startsWith("image/") && session) {
            fs.renameSync(tempPath, targetPath);
            var profile = await Profile.getProfileById(session.profileId);
            profile.avatar.flag = flag;
            profile.avatar.extention = extention;
            await profile.save();
            res.sendStatus(200);
        } else fs.unlinkSync(tempPath);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

// récupérer profil fonctionne
app.get("/api/profile/@me", async (req, res) => {
    var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
    if (!session) return res.sendStatus(401);
    res.status(200).send({ username, id } = session);
});

// créer profil fonctionne
app.post("/api/profile", rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), async (req, res) => {
    try {
        if (!req.body.username || !req.body.password) throw new Error("Requête invalide.");
        var session_ = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (session_) throw new Error("Vous êtes déjà authentifié(e)");
        var { username, password } = req.body;
        username = username.toLowerCase().trim();
        password = password.trim();
        if (USERNAMES_NOT_ALLOWED.includes(username)) throw new Error("Nom d'utilisateur non autorisé.");
        if (!/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/.test(password)) throw new Error("Une erreur inexpliquée s'est produite.");
        var profile = await Profile.create(username, password);
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        var session = await Session.create(profile._id, req.fingerprint.hash, ip);
        res.cookie("token", session.token, { expires: new Date(session.expiresIn * 1000 + new Date().getTime()) }).cookie("id", session._id.toString(), { expires: new Date(session.expiresIn * 1000 + new Date().getTime()) }).json(profile);
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// supprimer la session fonctionne
app.delete("/api/profile", async (req, res) => {
    try {
        var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (!session) return res.sendStatus(401);

        await Session.disable(session.id);
        res.sendStatus(200);

    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// connexion fonctionne pas (duplicate)

app.post("/api/login", async (req, res) => {
    try {
        console.log(req.body)
        if (!req.body) throw new Error("Mauvaise requête.");
        const { username, password } = req.body;
        var profileId = await Profile.check(username, password)
        if (!profileId) throw new Error("Identifants incorrects.");
        var session = await Session.getSessionByProfileId(profileId)
        if (session) {
            session.active = true;
            await session.save();
        } else {
            var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await Session.create(profileId, req.fingerprint.hash, ip);
            res.status(201).json({ username: Profile.getProfileById(session.profileId).username });
        }

    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// post message fonctionne pas
app.put("/api/message", rateLimit({
    windowMs: 1000 * 5,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false
}), rateLimit({
    windowMs: 1000 * 60,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
}), async (req, res) => {
    try {
        var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (!session) return res.sendStatus(401);

        var content = req.body.content.trim();
        await Message.create({ id, username } = profile, content);
        profile.isTyping = false;

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// récupérer des messages
app.get("/api/messages", async (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        var from = req.query.from;
        var mes = await Message.getMessages(profile, from, 20);
        res.status(200).json(mes);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// mettre à jour un message
app.put("/api/message/:id", async (req, res) => {
    try {
        return res.status(400).send("Cette méthode n'est pas encore implémentée.");

        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        var id = req.params.id;
        var content = req.body.content.trim();
        var message = await Message.editMessage(profile.id, new ObjectId(id), content);
        res.status(200).json(Message.getMessageFields(profile, message));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.put("/api/messages/view", async (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        var ids = req.body.ids;
        if (!ids || !Array.isArray(ids)) throw new Error("Requête invalide.");
        ids = ids.map(a => ObjectId.isValid(a) ? new ObjectId(a) : null);
        ids = ids.filter(a => a != null);
        if (ids.length == 0) throw new Error("Requête invalide.");

        var messages = await Message.addViewToMessages(ids, profile.id);

        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// supprimer un message
app.delete("/api/message/:id", async (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        var id = req.params.id;
        var message = await Message.deleteMessage(profile.id, new ObjectId(id));
        res.status(200).json(Message.getMessageFields(profile, message));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// fonctionne pas
app.get("/api/profiles/typing", (req, res) => {
    try {
        var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
        if (!session) return res.sendStatus(401);
        res.status(200).json(Profile.profiles.filter(a => a.isTyping).map(b => b.username));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// fonctionne pas 
app.put("/api/typing", (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);
        var isTyping = req.body.isTyping ? true : false;
        if (profile.isTyping == isTyping) return res.sendStatus(200);
        profile.isTyping = isTyping;
        io.to("authenticated").emit("message.typing", { isTyping, username: profile.username });
        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

function generateID(length) {
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];
    for (var i = 0; i < length; i++) {
        var j = (Math.random() * (a.length - 1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}