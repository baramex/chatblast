/* constantes */
const FIELD_REGEX = /^[a-z]{1,32}$/;
const USERNAMES_NOT_ALLOWED = ["server"];

/* modules */
const rateLimit = require("express-rate-limit");
const path = require("path");
const { Profile } = require("./profile");
const { app, io } = require("./server");

io.on("connection", (socket) => {
    var token = socket.handshake.headers.cookie.split("; ").find(a => a.startsWith("token=")).replace("token=", "");
    if (token) {
        var profile = Profile.getProfileByToken(token);
        if (profile) {
            socket.join(["authenticated", "userid:" + profile.id]);
        }
    }
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
    if (!profile) return res.status(403).send("Non autorisé.");

    res.status(200).send(Profile.getOnlines().map(a => a.username));
});

// récupérer profile
app.get("/api/profile/@me", (req, res) => {
    var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
    if (!profile) return res.status(403).send("Non autorisé.");

    res.status(200).send({ username, id } = profile);
});

// créer profile
app.post("/api/profile", rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
}), (req, res) => {
    try {
        var username = req.body.username?.toLowerCase()?.trim();
        if (!username || !FIELD_REGEX.test(username)) throw new Error("Nom d'utilisateur invalide.");

        if (USERNAMES_NOT_ALLOWED.includes(username)) throw new Error("Nom d'utilisateur non autorisé.");

        var profile = new Profile(username, req.fingerprint, req.ipInfo?.ip);

        res.status(200).cookie("token", profile.token, { expires: new Date(profile.date.getTime() + profile.expireIn * 1000) }).send({ username, id } = profile);
    }
    catch (err) {
        console.error(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

// supprimer profile
app.delete("/api/profile", (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
        if (!profile) return res.status(403).send("Non autorisé.");

        Profile.delete(profile.id);

        res.sendStatus(200);
    } catch (err) {
        res.status(400).send(err.message || "Erreur inattendue");
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
        if (!profile) return res.status(403).send("Non autorisé.");

        var message = req.body.message?.trim();
        if (!message || message.length < 1 || message.length > 256) throw new Error("Message invalide.");

        var sockets = await io.to("authenticated").fetchSockets();
        var users = [];
        sockets = sockets.filter(a => {
            var room = Array.from(a.rooms.values()).find(b => b.startsWith("userid:"));
            if (users.includes(room)) return false;
            users.push(room);
            return true;
        });
        io.to("authenticated").emit("message.send", { author: { id, username } = profile, message, count: sockets.length });
        res.sendStatus(201);
    } catch (err) {
        res.status(400).send(err.message || "Erreur inattendue");
    }
});