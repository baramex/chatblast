/* constantes */
const FIELD_REGEX = /^[a-z]{1,32}$/;
const USERNAMES_NOT_ALLOWED = ["system"];

/* modules */
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const path = require("path");
const { Message } = require("./models/message.model");
const { Profile } = require("./profile");
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
app.get("/", (req, res) => {
    if (!req.cookies?.token || !Profile.getProfile(req.cookies?.token, req.fingerprint)) return res.redirect("/login");
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/login", (req, res) => {
    if (req.cookies?.token && Profile.getProfile(req.cookies?.token, req.fingerprint)) return res.redirect("/");
    res.sendFile(path.join(__dirname, "pages", "login.html"));
});

app.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "terms.html"));
});

/* api */
// utilisateurs en ligne
app.get("/api/profiles/online", (req, res) => {
    var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
    if (!profile) return res.sendStatus(401);

    res.status(200).send(Profile.profiles.map(a => a.username));
});

// récupérer profil
app.get("/api/profile/@me", async (req, res) => {
    var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
    if (!profile) return res.sendStatus(401);

    res.status(200).send({ username: profile.username, id: profile.id, unread: await Message.getUnreadCount(profile.id) });
});

// actualiser profil
app.post("/api/profile/refresh", async (req, res) => {
    try {
        var username = req.body.username;
        var id = req.body.id;
        if (!username || !FIELD_REGEX.test(username) || !id) throw new Error("Requête invalide.");
        var socket = Array.from(io.sockets.sockets.values()).find(a => a.profileId == id && !a.rooms.has("authenticated"));
        var type = "refresh";
        if (!socket) type = "new";

        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        var profile = new Profile(username, req.fingerprint, ip, type == "refresh" ? id : undefined);

        if (socket) socket.join("authenticated");

        res.status(200).cookie("token", profile.token, { expires: new Date(profile.date.getTime() + 1000 * 60 * 60 * 24) }).send({ username: profile.username, id: profile.id, unread: await Message.getUnreadCount(profile.id), type });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// créer profil
app.post("/api/profile", rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), async (req, res) => {
    try {
        var username = req.body.username?.toLowerCase()?.trim();
        if (!username || !FIELD_REGEX.test(username)) throw new Error("Nom d'utilisateur invalide.");

        if (USERNAMES_NOT_ALLOWED.includes(username)) throw new Error("Nom d'utilisateur non autorisé.");

        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        var profile = new Profile(username, req.fingerprint, ip);

        res.status(200).cookie("token", profile.token, { expires: new Date(profile.date.getTime() + 1000 * 60 * 60 * 24) }).send({ username: profile.username, id: profile.id, unread: await Message.getUnreadCount(profile.id) });
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// supprimer profil
app.delete("/api/profile", (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        Profile.delete(profile.id);

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// post message
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
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

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
        var mes = await Message.getMessages(profile.id, from, 20);
        res.status(200).json(mes);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// mettre à jour un message
app.put("/api/message/:id", async (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);

        var id = req.params.id;
        var content = req.body.content.trim();
        var message = await Message.editMessage(profile.id, new ObjectId(id), content);
        res.status(200).json(Message.getMessageFields(profile.id, message));
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
        var message = await Message.deleteMessage(new ObjectId(id));
        res.status(200).json(Message.getMessageFields(profile.id, message));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.get("/api/profiles/typing", (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.sendStatus(401);
        res.status(200).json(Profile.profiles.filter(a => a.isTyping).map(b => b.username));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

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