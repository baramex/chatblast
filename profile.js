const randomWebToken = require("random-web-token");
const { io } = require("./server");

class Profile {
    /**
     * @type {{id: String, hash: String, token: String, ip: String, username: String, online: Boolean, lastPing: Date, expireIn: Number, date: Date}[]}
     */
    static profiles = [];

    /**
     * 
     * @param {String} username 
     * @param {Object} fingerprint
     * @param {String} fingerprint.hash
     * @param {Object[]} [fingerprint.components]
     * @param {String} ip 
     */
    constructor(username, fingerprint, ip) {
        if (Profile.isUsernameExist(username)) throw new Error("Le nom d'utilisateur existe déjà.");

        this.ip = ip;
        this.id = randomWebToken.generate("onlyNumbers", 10);
        this.hash = fingerprint.hash;
        this.token = randomWebToken.generate("extra", 30);
        this.username = username;
        this.online = true;

        var p = Profile.pushProfile(this.id, this.hash, this.token, this.ip, this.username);
        this.date = p.date;
        this.expireIn = p.expireIn;
        this.lastPing = p.lastPing;
    }

    /**
     * 
     * @param {String} id 
     */
    static delete(id) {
        var index = Profile.profiles.findIndex(a => a.id == id);
        if (index == -1) throw new Error("Profil introuvable.");

        Profile.setOffline(Profile.profiles[index].id);
        return Profile.profiles.splice(index, 1);
    }

    /**
     * 
     * @param {Object} fingerprint 
     */
    static deleteFromFP(fingerprint) {
        var index = Profile.profiles.findIndex(a => a.hash == fingerprint.hash);
        if (index == -1) throw new Error("Profil introuvable.");

        return Profile.profiles.splice(index, 1);
    }

    /**
     * 
     * @param {String} ip 
     */
    static deleteFromIp(ip) {
        var index = Profile.profiles.findIndex(a => a.ip == ip);
        if (index == -1) throw new Error("Profil introuvable.");

        return Profile.profiles.splice(index, 1);
    }

    /**
     * 
     * @param {String} username 
     * @returns 
     */
    static isUsernameExist(username) {
        return Profile.profiles.find(a => a.username == username) ? true : false;
    }

    /**
     * 
     * @param {Object} fingerprint
     * @param {String} fingerprint.hash
     * @param {Object[]} [fingerprint.components]
     */
    static fingerprintHasProfile(fingerprint) {
        return Profile.profiles.find(a => a.hash == fingerprint.hash) ? true : false;
    }

    /**
     * 
     * @param {String} ip 
     */
    static ipHasProfile(ip) {
        return Profile.profiles.find(a => a.ip == ip) ? true : false;
    }

    static getOnlines() {
        return Profile.profiles.filter(a => a.online);
    }

    static setOnline(id) {
        var p = Profile.profiles.find(a => a.id == id);
        if (!p) throw new Error("Profil introuvable.");

        if (!p.online) {
            p.online = true;

            io.sockets.emit("profile.join", { id: p.id, username: p.username });
        }

        p.lastPing = new Date();
        return p;
    }

    static setOffline(id) {
        var p = Profile.profiles.find(a => a.id == id);
        if (!p) throw new Error("Profil introuvable.");

        if (p.online) {
            p.online = false;

            io.sockets.emit("profile.leave", { id: p.id, username: p.username });
        }

        return p;
    }

    /**
     * 
     * @param {String} id 
     * @param {String} hash
     * @param {String} token 
     * @param {String} ip 
     * @param {String} username 
     */
    static pushProfile(id, hash, token, ip, username) {
        if (Profile.profiles.find(a => a.id == id) || Profile.profiles.find(a => a.token == token)) throw new Error("Impossible de créer le profil.");
        return Profile.profiles[Profile.profiles.push({ id, hash, token, ip, username, online: false, lastPing: new Date(), expireIn: 60 * 60 * 2, date: new Date() }) - 1];
    }

    static getProfile(token, fingerprint) {
        var profile = Profile.profiles.find(a => a.token == token && a.hash == fingerprint.hash);
        if (!profile) return null;
        return Profile.setOnline(profile.id);
    }

    static getProfileByToken(token) {
        return Profile.profiles.find(a => a.token == token);
    }

    static update() {
        Profile.profiles = Profile.profiles.filter(a => new Date().getTime() - a.date.getTime() < a.expireIn * 1000);

        Profile.profiles.filter(a => a.online).forEach(pro => {
            if (new Date().getTime() - pro.lastPing.getTime() > 1000 * 60 * 1.2) Profile.setOffline(pro.id);
        });

        setTimeout(Profile.update, 1000 * 60 * 1.5);
    }
}

Profile.update();

module.exports = { Profile };