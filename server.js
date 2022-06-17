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
        if (!["http://localhost:1500", "http://chatblast.baramex.me", "http://chat-box.baramex.me"].includes(origin)) return callback(new Error("The CORS policy for this site does not allow access from the specified Origin.", false))

        callback(null, true);
    },
    credentials: true
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

/* serveur/socket.io */
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
server.listen(PORT, () => {
    console.log("Serveur lancé sur le port: " + PORT);
});

module.exports = { io, app };