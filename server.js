/* constantes */
const PORT = 1500;

/* express */
const express = require("express");
const app = express();
app.use(express.static("./ressources"))

/* middleware */
var cors = require('cors');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (!["http://localhost:1500", "https://www.chatblast.baramex.me"].includes(origin)) return callback(new Error("The CORS policy for this site does not allow access from the specified Origin.", false))

        callback(null, true);
    },
    credentials: true
}));
const rateLimit = require('express-rate-limit');
const baseLimiter = rateLimit({
    windowMs: 1000 * 5,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(baseLimiter);
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const multer = require("multer");
const upload = multer({
    dest: "./avatars", limits: "0.5mb", fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            callback(new Error("Type de fichier invalide."), false);
        }
        else callback(false, true);
    }
});
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const Fingerprint = require('express-fingerprint');
app.use(Fingerprint({
    parameters: [
        Fingerprint.useragent,
        Fingerprint.geoip
    ]
}));

/* serveur/socket.io */
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
server.listen(PORT, () => {
    console.log("Serveur lancé sur le port: " + PORT);
});

module.exports = { io, app, upload };