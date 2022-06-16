/* constantes */
const PORT = 1500;
const FIELD_REGEX = /^[a-z]{1,32}$/i;

/* modules */
// express
const express = require("express");
const app = express();
app.use(express.static("./ressources"))

// middleware
var cors = require('cors');
app.use("/api/*", cors({
    origin: "self"
}));
const rateLimit = require('express-rate-limit');
const baseLimiter = rateLimit({
    windowMs: 1000 * 5,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(baseLimiter);
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const Fingerprint = require('express-fingerprint');
app.use(Fingerprint({
    parameters: [
        Fingerprint.useragent,
        Fingerprint.geoip
    ]
}));
const expressip = require('express-ip');
app.use(expressip().getIpInfoMiddleware);

// autres modules
const path = require("path");

// serveur/socket.io
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { Profile } = require("./profile");
const io = new Server(server);
server.listen(PORT, () => {
    console.log("Serveur lancé sur le port: " + PORT);
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

    Profile.setOnline(profile.id);

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
        var username = req.body.username;
        if (!username || !FIELD_REGEX.test(username)) throw new Error("Nom d'utilisateur invalide.");

        var profile = new Profile(username.trim(), req.fingerprint, req.ipInfo?.ip);
        console.log(Profile.profiles);

        res.status(200).cookie("token", profile.token, { expires: new Date(profile.date.getTime() + profile.expireIn * 1000) }).send({ username, id } = profile);
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err.message || "Erreur inattendue");
    }
});

// supprimer profile
app.delete("/api/profile", (req, res) => {
    try {
        var profile = Profile.getProfile(req.cookies?.token, req.fingerprint);
        if (!profile) return res.status(403).send("Non autorisé.");

        Profile.delete(profile.id);

        console.log(Profile.profiles);

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
}), (req, res) => {
    try {
        var message = req.body.message?.trim();
        if (!message || message.length < 1 || message.length > 256) throw new Error("Message invalide.");

        var profile = Profile.getProfile(req.cookies.token, req.fingerprint);
        if (!profile) return res.status(403).send("Non autorisé.");

        io.sockets.emit("message.send", { author: { id, username } = profile, message, count: io.sockets.sockets.size });
        res.sendStatus(201);
    } catch (err) {
        res.status(400).send(err.message || "Erreur inattendue");
    }
});