const { Schema, model, ObjectId } = require("mongoose");
const token = require("random-web-token");

const session = new Schema({
    token: { type: String, required: true },
    profileId: { type: ObjectId, required: true, unique: true },
    expiresIn: { type: Number, required: true },
    ips: { type: [String], required: true },
    fingerprints: { type: [String], required: true },
    active: { type: Boolean, default: true },
    date: { type: Date, default: new Date() },
});

session.pre("validate", function (next) {
    if (!this.token) {
        this.token = token.generate("extra", 30);
        this.date = new Date();
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
            var doc = new SessionModel({ profileId, fingerprints: [fingerprint], expiresIn: 60 * 60 * 24, ips: [ip] });
            doc.save(err => {
                if (err) rej(err);
                else res(doc);
            });
        });
    }

    /**
     * 
     * @param {ObjectId} id 
     */

    static disable(id) {
        return SessionModel.updateOne({ _id: id }, { $unset: { token: "" }, $set: { active: false } });
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

    /**
     * 
     * @param {ObjectId} id 
     * @returns 
     */

    static getSessionById(id) {
        return SessionModel.findOne({ _id: id })._id;
    }

    /**
     * 
     * @param {ObjectId} id
     */
    static getByProfileId(id) {
        return SessionModel.findOne({ profileId: id });
    }

    /**
     * 
     * @param {Date} date 
     * @param {Number} expireIn 
     */
    static checkExpired(date, expireIn) {
        return (new Date().getTime() - date.getTime()) > expireIn * 1000;
    }

    static getSessionByProfileId(profileId) {

    }

    static update() {
        
        SessionModel.updateMany({ date }, { $set: { date: new Date() } });
    }
    
}

// setInterval(Session.update, 1000 * 60 * 30 );
module.exports = { Session };