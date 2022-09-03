/* constantes */
const FIELD_REGEX = /^[a-z]{1,32}$/;
const USERNAMES_NOT_ALLOWED = ["system"];

/* modules */
require("dotenv").config();
const cors = require('cors');
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const path = require("path");
const { Profile } = require("./models/profile.model");
const { Session, SessionMiddleware } = require("./models/session.model");
const fs = require("fs");
const { Message } = require("./models/message.model");
const { app, io, upload } = require("./server");
const { getClientIp } = require("request-ip");
const { Integration, INTEGRATIONS_TYPE, TOKEN_PLACES_TYPE } = require("./models/integration.model");
const { default: axios } = require("axios");
mongoose.connect(process.env.DB, { dbName: process.env.DB_NAME });

let typing = [];
let disconnected = [];

io.on("connection", async (socket) => {
    const token = socket.handshake.headers.cookie?.split("; ")?.find(a => a.startsWith("chatblast-token="))?.replace("chatblast-token=", "");
    if (token) {
        const session = await Session.getSessionByToken(token).catch(console.error);
        if (session) {
            const profile = await Profile.getProfileById(session.profileId).catch(console.error);
            if (profile) {
                socket.profileId = session.profileId;
                socket.join(["authenticated", "profileid:" + session.profileId.toString()]);

                const d = disconnected.findIndex(a => a.id.equals(profile._id));
                if (d != -1) disconnected.splice(d, 1);
                else {
                    await Session.connectMessage(profile).catch(console.error);
                }
            }
        }
    }

    socket.on("disconnecting", async () => {
        const profileId = socket.profileId;
        if (!profileId) return;

        const rooms = socket.rooms;

        const profile = await Profile.getProfileById(profileId);
        if (!profile) return;

        if (rooms.has("authenticated")) {
            disconnected.push({ id: profileId, date: new Date().getTime() });
        }
    });
});

// disconnect
setInterval(() => {
    disconnected.filter(a => a.date <= new Date().getTime() - 1000 * 10).forEach(async ({ id }) => {
        if (Array.from(io.sockets.sockets.values).find(a => a.profileId.equals(id))) return;
        const i = typing.findIndex(a => a.id.equals(id));
        if (i != -1) typing.splice(i, 1);
        await Session.disconnectMessage(await Profile.getProfileById(id).catch(console.error)).catch(console.error);
    });
    disconnected = disconnected.filter(a => a.date > new Date().getTime() - 1000 * 10);
}, 1000 * 10);

// récupérer avatar
app.get("/profile/:id/avatar", SessionMiddleware.auth, async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || (!ObjectId.isValid(id) && id != "@me")) throw new Error("Requête invalide.");
        const profile = (id == "@me" || id == req.profile._id.toString()) ? req.profile : await Profile.getProfileById(new ObjectId(id));

        const name = profile.avatar.flag + profile.avatar.extention;
        if (!name || !fs.existsSync(path.join(__dirname, "avatars", name))) return res.sendFile(path.join(__dirname, "avatars", "user.png"));
        res.sendFile(path.join(__dirname, "avatars", name));
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

/* api */

app.get("/api/integration/:id", async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) throw new Error("Requête invalide.");

        const integration = await Integration.getById(new ObjectId(id));
        if (!integration) throw new Error("Intégration introuvable.");

        res.json({ state: integration.state, type: integration.type, cookieName: integration.options.cookieName });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.post("/api/integration/:int_id/profile/oauth", SessionMiddleware.isAuthed, async (req, res) => {
    try {
        if (req.isAuthed) throw new Error("Vous êtes déjà authentifié.");

        const intId = req.params.int_id;
        if (!ObjectId.isValid(intId)) throw new Error("Requête invalide.");

        const integration = await Integration.getById(new ObjectId(intId));
        if (!integration) throw new Error("Intégration introuvable.");

        if (integration.type === INTEGRATIONS_TYPE.CUSTOM_AUTH) {
            const token = req.headers.authorization.replace("Token", "");
            if (!token) throw new Error("Requête invalide.");

            let config = {};
            switch (integration.options.verifyAuthToken.token.place) {
                case TOKEN_PLACES_TYPE.AUTHORIZATION: config = { headers: { authorization: integration.options.verifyAuthToken.token.key + token } }; break;
                case TOKEN_PLACES_TYPE.QUERY: config = { params: { [integration.options.verifyAuthToken.token.key]: token } }; break;
                case TOKEN_PLACES_TYPE.URLENCODED: config = { data: qs.stringify({ [integration.options.verifyAuthToken.token.key]: token }), headers: { 'content-type': 'application/x-www-form-urlencoded' } }; break;
            }

            let result = (await axios.get(integration.options.verifyAuthToken.route, config).catch(() => { throw new Error("Erreur de vérification du token.") })).data;
            if (!result || !result.username || !result.id) throw new Error("Erreur de vérification du token.");

            let i = 0;
            while (await Profile.usernameExists(result.username) && i < 10) {
                result.username += Math.floor(Math.random() * 10);
                i++;
            }
            if (i === 10) throw new Error("Erreur de vérification du token.");

            const profile = await Profile.create(result.username, undefined, result.id, result.avatar, integration._id);
            const session = await Session.create(profile._id, req.fingerprint.hash, getClientIp(req));
            const expires = new Date(24 * 60 * 60 * 1000 + new Date().getTime());
            res.cookie("chatblast-token", session.token, { expires, sameSite: "none", secure: "true" }).json({ id: profile._id, username: profile.username });
        }
        else {
            // TODO: anonymous auth
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.get("/api/user/@me", (req, res) => {
    res.send({ id: "abc123", username: "test", avatar: "https://cdn.discordapp.com/avatars/123456789012345678/123456789012345678.png" });
});

// utilisateurs en ligne
app.get("/api/profiles/online", SessionMiddleware.auth, async (req, res) => {
    try {
        const online = (await io.to("authenticated").fetchSockets()).map(a => a.profileId).concat(disconnected.map(a => a.id));
        res.status(200).send((await Profile.getUsernamesByIds(online)).map(a => ({ id: a._id, username: a.username })));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// récupérer profil
app.get("/api/profile/@me", SessionMiddleware.auth, async (req, res) => {
    res.status(200).send({ username: req.profile.username, id: req.profile._id, unread: await Message.getUnreadCount(req.profile) });
});

// upload avatar fonctionne
app.put("/api/profile/@me/avatar", rateLimit({
    windowMs: 1000 * 60 * 10,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), SessionMiddleware.auth, upload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) throw new Error("Requête invalide.");

        const flag = generateID(15);
        const tempPath = req.file.path;
        const extention = path.extname(req.file.originalname).toLowerCase()
        const targetPath = path.join(__dirname, "avatars", flag + extention);

        fs.renameSync(tempPath, targetPath);

        req.profile.avatar = { flag, extention };
        await req.profile.save();

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

// créer profil
app.post("/api/profile", rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), SessionMiddleware.isAuthed, async (req, res) => {
    try {
        if (req.isAuthed) throw new Error("Vous êtes déjà authentifié.");
        if (!req.body || !req.body.username || !req.body.password) throw new Error("Requête invalide.");

        let { username, password } = req.body;
        username = username.toLowerCase().trim();
        password = password.trim();

        if (USERNAMES_NOT_ALLOWED.includes(username)) throw new Error("Nom d'utilisateur non autorisé.");
        if (!/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/.test(password) || !FIELD_REGEX.test(username)) throw new Error("Requête invalide.");

        const profile = await Profile.create(username, password);
        const ip = getClientIp(req);
        const session = await Session.create(profile._id, req.fingerprint.hash, ip);
        const expires = new Date(24 * 60 * 60 * 1000 + new Date().getTime());
        res.cookie("chatblast-token", session.token, { expires, sameSite: "none", secure: "true" }).json({ username: profile.username, id: profile._id, unread: await Message.getUnreadCount(profile) });
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// supprimer la session
app.delete("/api/profile", SessionMiddleware.auth, async (req, res) => {
    try {
        await Session.disable(req.session);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// connexion
app.post("/api/login", SessionMiddleware.isAuthed, async (req, res) => {
    try {
        if (req.isAuthed) throw new Error("Vous êtes déjà authentifié.");
        if (!req.body || !req.body.username || !req.body.password) throw new Error("Requête invalide.");

        const { username, password } = req.body;

        const profile = await Profile.check(username, password);
        if (!profile) throw new Error("Identifants incorrects.");

        let session = await Session.getSessionByProfileId(profile._id);
        const ip = getClientIp(req);
        if (session) {
            session.active = true;
            if (!session.fingerprints.includes(req.fingerprint.hash)) session.fingerprints.push(req.fingerprint.hash);
            if (!session.ips.includes(ip)) session.ips.push(ip);
            await session.save({ validateBeforeSave: true });
        } else {
            session = await Session.create(profile._id, req.fingerprint.hash, ip);
        }

        const expires = new Date(24 * 60 * 60 * 1000 + new Date().getTime());
        res.cookie("chatblast-token", session.token, { expires, sameSite: "none", secure: "true" }).json({ username: profile.username, id: profile._id, unread: await Message.getUnreadCount(profile) });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// message
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
}), SessionMiddleware.auth, async (req, res) => {
    try {
        if (!req.body || !req.body.content) throw new Error("Requête invalide.");

        const content = req.body.content.trim();
        await Message.create(req.profile._id, content);

        const i = typing.findIndex(a => a.id.equals(req.profile._id));
        if (i != -1) typing.splice(i, 1);

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// récupérer des messages
app.get("/api/messages", SessionMiddleware.auth, async (req, res) => {
    try {
        if (!req.query || !req.query.from) throw new Error("Requête invalide.");

        const from = req.query.from;
        const mes = await Message.getMessages(req.profile, from, 20);
        res.status(200).json(mes);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// mettre à jour un message
app.put("/api/message/:id", (req, res) => {
    return res.status(400).send("Cette méthode n'est pas encore implémentée.");
    /*try {
        const profile = Profile.getProfile(req.cookies["chatblast-token"], req.fingerprint);
        if (!profile) return res.sendStatus(401);

        const id = req.params.id;
        const content = req.body.content.trim();
        const message = await Message.editMessage(profile.id, new ObjectId(id), content);
        res.status(200).json(Message.getMessageFields(profile, message));
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }*/
});

// voir des messages
app.put("/api/messages/view", SessionMiddleware.auth, async (req, res) => {
    try {
        if (!req.body || !req.body.ids) throw new Error("Requête invalide.");

        let ids = req.body.ids;
        if (!Array.isArray(ids)) throw new Error("Requête invalide.");

        ids = ids.map(a => ObjectId.isValid(a) ? new ObjectId(a) : null);
        ids = ids.filter(a => a != null);
        if (ids.length == 0) throw new Error("Requête invalide.");

        await Message.addViewToMessages(ids, req.profile._id);

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.put("/api/messages/view/all", SessionMiddleware.auth, async (req, res) => {
    try {
        const unreadMessages = await Message.getUnread(req.profile);

        if (unreadMessages.length === 0) return res.sendStatus(200);

        await Message.addViewToMessages(unreadMessages.map(a => a._id), req.profile._id);

        res.sendStatus(201);
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// supprimer un message
app.delete("/api/message/:id", SessionMiddleware.auth, async (req, res) => {
    try {
        const id = req.params.id;
        const message = await Message.getById(new ObjectId(id));
        if (!message.author._id.equals(req.profile._id)) return res.sendStatus(403);

        message.deleted = true;
        await message.save();

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// récupérer ceux qui évrivent
app.get("/api/profiles/typing", SessionMiddleware.auth, async (req, res) => {
    try {
        res.status(200).json(typing);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

// écrire
app.put("/api/typing", SessionMiddleware.auth, (req, res) => {
    try {
        const isTyping = req.body.isTyping ? true : false;

        const i = typing.findIndex(a => a.id.equals(req.profile._id));
        if ((i == -1 && !isTyping) || (i != -1 && isTyping)) return res.sendStatus(200);

        if (isTyping) addTyping(req.profile);
        else removeTyping(req.profile);

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message || "Erreur inattendue");
    }
});

app.get("/integrations/:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) throw new Error();

        const integration = await Integration.getById(new ObjectId(id));
        if (!integration) throw new Error();

        cors((req, callback) => {
            if (!req.headers.referer) return callback("Not allowed by CORS.");
            if (req.headers.referer.endsWith("/")) req.headers.referer = req.headers.referer.slice(0, -1);
            if (req.headers.referer !== integration.options.domain) return callback("Not allowed by CORS.");
            callback(null, { origin: true });
        })(req, res, next);
    } catch (error) {
        console.error(error);
        res.redirect("/");
    }
});

app.get("*", (req, res) => {
    res.sendFile("public/index.html", { root: __dirname });
});

function generateID(length) {
    const a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    const b = [];
    for (let i = 0; i < length; i++) {
        const j = (Math.random() * (a.length - 1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

function addTyping(profile) {
    if (!typing.some(a => a.id.equals(profile._id))) {
        typing.push({ id: profile._id, username: profile.username });
        io.to("authenticated").emit("message.typing", { isTyping: true, id: profile._id, username: profile.username });
    }
}

function removeTyping(profile) {
    const i = typing.findIndex(a => a.id.equals(profile._id));
    if (i != -1) {
        typing.splice(i, 1);
        io.to("authenticated").emit("message.typing", { isTyping: false, id: profile._id, username: profile.username });
    }
}