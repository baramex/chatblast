const { Schema, model, Types } = require("mongoose");
const bcrypt = require('bcrypt');
const { default: validator } = require("validator");

const profileSchema = new Schema({
    userId: { type: String },
    username: { type: String, required: true, validate: /^[a-z0-9]{1,32}$/, unique: true },
    password: { type: String },
    integrationId: { type: Types.ObjectId },
    avatar: { type: { flag: String, extention: String, urL: { type: String, validate: (e) => validator.isURL(e) || validator.isDataURI(e) }, _id: false }, default: { flag: "", extention: "" } },
    permissions: { type: [String], default: [] },
    date: { type: Date, default: Date.now }
});

const profileModel = model("Profile", profileSchema, "profiles");

class Profile {
    static create(username, password, id, avatar, integrationId) {
        return new Promise(async (res, rej) => {
            new profileModel({ username, password: password ? await bcrypt.hash(password, 10) : undefined, userId: id, avatar: { url: avatar }, integrationId }).save().then(res).catch((error) => {
                if (error.code == 11000 && error.keyPattern.username) rej(new Error("Un compte est déjà asssocié à ce nom d'utilisateur."));
                else rej(error);
            });
        });
    }

    static async usernameExists(username) {
        return !!await profileModel.exists({ username });
    }

    static getProfileById(id) {
        return profileModel.findById(id);
    }

    static async check(username, password) {
        var profile = await profileModel.findOne({ username });
        if (!profile) return false;
        if (await bcrypt.compare(password, profile.password)) return profile;
        return false;
    }

    static getProfileByToken(token) {
        return profileModel.findOne({ token });
    }

    static getUsernamesByIds(ids) {
        return profileModel.find({ _id: { $in: ids } }, { username: true });
    }
}

module.exports = { Profile };