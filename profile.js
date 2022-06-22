const randomWebToken = require("random-web-token");
const { io } = require("./server");
const mongoose = require("mongoose");
const { Message } = require("./models/message.model");
const { ObjectId } = mongoose.Types;

const systemId = new ObjectId(0);

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
    static async create(username, fingerprint, ip, id = undefined) {
        if (Profile.isUsernameExist(username)) throw new Error("Le nom d'utilisateur existe déjà.");

        return Profile.pushProfile(id || new ObjectId(), fingerprint.hash, randomWebToken.generate("extra", 30), ip, username);
    }

    /**
     * 
     * @param {String} id 
     */
    static async delete(id) {
        var index = Profile.profiles.findIndex(a => a.id == id);
        if (index == -1) throw new Error("Profil introuvable.");

        var profile = Profile.profiles[index];
        io.to("profileid:" + profile.id).socketsLeave("authenticated");
        await Message.create({ username: "SYSTEM", id: systemId }, "<strong>" + profile.username + "</strong> a quitté la session.");
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
    static async pushProfile(id, hash, token, ip, username) {
        if (Profile.profiles.find(a => a.id == id) || Profile.profiles.find(a => a.token == token)) throw new Error("Impossible de créer le profil.");
        await Message.create({ username: "SYSTEM", id: systemId }, "<strong>" + username + "</strong> a rejoint la session.");
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
            if (new Date().getTime() - pro.lastPing.getTime() > 1000 * 80 && (await io.to(pro.id).allSockets()).size == 0) {
                Profile.delete(pro.id);
            }
        });

        io.sockets.sockets.forEach(socket => {
            if (socket.rooms.has("authenticated")) {
                var id = socket.profileId;
                var profile = Profile.getProfileByID(id);
                if (!profile) socket.leave("authenticated");
            }
        });

        setTimeout(Profile.update, 1000 * 10);
    }
}

Profile.update();

module.exports = { Profile };