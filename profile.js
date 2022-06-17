const randomWebToken = require("random-web-token");
const { io } = require("./server");

class Profile {
    /**
     * @type {{id: String, hash: String, token: String, ip: String, username: String, lastPing: Date, expireIn: Number, date: Date, isTyping: boolean}[]}
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
        this.isTyping = false;

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

        var profile = Profile.profiles[index];
        io.to("authenticated").emit("profile.leave", { id: profile.id, username: profile.username });

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

    static ping(id) {
        var p = Profile.profiles.find(a => a.id == id);
        if (!p) throw new Error("Profil introuvable.");

        p.lastPing = new Date();
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
        io.to("authenticated").emit("profile.join", { id, username });
        return Profile.profiles[Profile.profiles.push({ id, hash, token, ip, username, lastPing: new Date(), date: new Date(), isTyping: false }) - 1];
    }

    static getProfile(token, fingerprint) {
        var profile = Profile.profiles.find(a => a.token == token && a.hash == fingerprint.hash);
        if (!profile) return null;
        return Profile.ping(profile.id);
    }

    static getProfileByToken(token) {
        return Profile.profiles.find(a => a.token == token);
    }

    static getProfileByID(id) {
        return Profile.profiles.find(a => a.id == id);
    }

    static update() {
        Profile.profiles.forEach(async pro => {
            if (new Date().getTime() - pro.lastPing.getTime() > 1000 * 60 * 1.2 && (await io.to(pro.id).allSockets()).size == 0) Profile.delete(pro.id);
        });

        setTimeout(Profile.update, 1000 * 60 * 1.5);
    }
}

Profile.update();

module.exports = { Profile };