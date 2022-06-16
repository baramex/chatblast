const randomWebToken = require("random-web-token");

class Profile {
    /**
     * @type {{id: String, fingerprint: Object, token: String, ip: String, username: String, expireIn: Number, date: Date}[]}
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
        if (Profile.fingerprintHasProfile(fingerprint)) throw new Error("Vous posséder déjà un profil.");

        this.ip = ip;
        this.id = randomWebToken.generate("onlyNumbers", 10);
        this.hash = fingerprint.hash;
        this.token = randomWebToken.generate("extra", 30);
        this.username = username;

        var p = Profile.pushProfile(this.id, this.hash, this.token, this.ip, this.username);
        this.date = p.date;
        this.expireIn = p.expireIn;
    }

    /**
     * 
     * @param {String} id 
     */
    static delete(id) {
        var index = Profile.profiles.findIndex(a => a.id == id);
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

    /**
     * 
     * @param {String} id 
     * @param {String} hash
     * @param {String} token 
     * @param {String} ip 
     * @param {String} username 
     */
    static pushProfile(id, hash, token, ip, username) {
        if (Profile.profiles.find(a => a.id == id) || Profile.profiles.find(a => a.token)) throw new Error("Impossible de créer le profil.");
        return Profile.profiles[Profile.profiles.push({ id, hash, token, ip, username, expireIn: 60 * 60 * 2, date: new Date() }) - 1];
    }

    static getProfile(token, fingerprint) {
        return Profile.profiles.find(a => a.token == token && a.hash == fingerprint.hash);
    }

    static update() {
        Profile.profiles = Profile.profiles.filter(a => new Date().getTime() - a.date.getTime() < a.expireIn * 1000);

        setTimeout(Profile.update, 1000 * 60 * 5);
    }
}

Profile.update();

module.exports = { Profile };