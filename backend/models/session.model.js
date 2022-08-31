const { Schema, model, default: mongoose } = require("mongoose");
const token = require("random-web-token");
const { io } = require("../server");
const { Message } = require("./message.model");
const { Profile } = require("./profile.model");
const { ObjectId } = mongoose.Types;

const systemId = new ObjectId(0);

const session = new Schema({
    token: { type: String },
    profileId: { type: ObjectId, required: true, unique: true },
    ips: { type: [String], required: true },
    fingerprints: { type: [String], required: true },
    active: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
});

session.post("validate", async function (doc, next) {
    if (doc.isModified("active") || doc.isNew) {
        if (doc.active) {
            doc.token = token.generate("extra", 30);
            doc.date = new Date();
            doc.markModified("token");
            doc.markModified("date");
        }
        else {
            doc.token = undefined;
            doc.markModified("token");

            io.to("profileid:" + doc.profileId.toString()).disconnectSockets(true);
        }
    }

    next();
});

const SessionModel = model('Session', session);

class Session {
    /**
     * 
     * @param {ObjectId} profileId 
     * @param {String} fingerprint
     * @param {String} ip 
     * @returns 
     */
    static create(profileId, fingerprint, ip) {
        return new Promise((res, rej) => {
            var doc = new SessionModel({ profileId, fingerprints: [fingerprint], ips: [ip] });
            doc.save(err => {
                if (err) rej(err);
                else res(doc);
            });
        });
    }

    static async disconnectMessage(profile) {
        io.to("authenticated").emit("profile.leave", { id: profile.id, username: profile.username });
    }

    static async connectMessage(profile) {
        io.to("authenticated").emit("profile.join", { id: profile.id, username: profile.username });
    }

    static disable(session) {
        session.active = false;
        return session.save({ runValidators: true });
    }

    /**
     * 
     * @param {ObjectId} id 
     * @param {String} ip 
     */
    static addIp(id, ip) {
        return SessionModel.updateOne({ _id: id }, { $addToSet: { ips: ip } });
    }

    /**
     * 
     * @param {ObjectId} id 
     * @param {String} fingerprint
     * @returns 
     */
    static addFingerprint(id, fingerprint) {
        return SessionModel.updateOne({ _id: id }, { $addToSet: { fingerprints: fingerprint } });
    }

    /**
     * 
     * @param {ObjectId} id 
     * @param {String} token 
     * @param {String} fingerprint
     */
    static getSession(id, token, fingerprint) {
        return SessionModel.findOne({ _id: id, token, fingerprints: { $all: [fingerprint] }, active: true });
    }

    static getSessionByToken(token) {
        return SessionModel.findOne({ token, active: true });
    }

    /**
     * 
     * @param {Date} date 
     * @param {Number} expireIn 
     */
    static checkExpired(date, expireIn) {
        return new Date().getTime() - date.getTime() > expireIn * 1000;
    }

    static getSessionByProfileId(profileId) {
        return SessionModel.findOne({ profileId });
    }

    static update() {
        SessionModel.updateMany({ active: true, date: { $gt: new Date().getTime() - 1000 * 60 * 60 * 24 } }, { $set: { active: false }, $unset: { token: true } }, { runValidators: true });

        io.sockets.sockets.forEach(async socket => {
            if (socket.rooms.has("authenticated")) {
                var id = socket.profileId;
                var profile = await Profile.getProfileById(id);
                if (!profile) return socket.leave("authenticated");

                var session = await Session.getSessionByProfileId(id);
                if (!session || !session.active) socket.leave("authenticated");
            }
        });
    }
}

class SessionMiddleware {
    static async auth(req, res, next) {
        try {
            var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
            if (!session) return res.sendStatus(401);

            var profile = await Profile.getProfileById(session.profileId);
            if (!profile) return res.sendStatus(401);

            req.session = session;
            req.profile = profile;
            next();
        } catch (error) {
            return res.status(400).send(error.message);
        }
    }

    static async isAuthed(req, res, next) {
        try {
            var session = await Session.getSession(req.cookies?.id, req.cookies?.token, req.fingerprint.hash);
            if (!session) throw new Error();

            var profile = await Profile.getProfileById(session.profileId);
            if (!profile) throw new Error();

            req.isAuthed = true;
            next();
        } catch (error) {
            req.isAuthed = false;
            next();
        }
    }
}

setInterval(Session.update, 1000 * 60 * 30);
module.exports = { Session, SessionMiddleware };