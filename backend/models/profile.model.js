const { Schema, model, Types } = require("mongoose");
const bcrypt = require('bcrypt');
const { default: isURL } = require("validator/lib/isURL");
const { default: isDataURI } = require("validator/lib/isDataURI");

const profileSchema = new Schema({
    userId: { type: String },
    username: { type: String, required: true, validate: /^[a-z0-9]{1,32}$/, unique: true },
    password: { type: String },
    integrationId: { type: Types.ObjectId },
    avatar: { type: { flag: String, extention: String, url: { type: String, validate: (e) => isURL(e) || isDataURI(e) }, _id: false }, default: { flag: "", extention: "", url: "" } },
    date: { type: Date, default: Date.now }
});

profileSchema.path("userId").validate(async function (v) {
    return v && this.isNew ? !await profileModel.exists({ userId: v }) : true;
});

const profileModel = model("Profile", profileSchema, "profiles");

class Profile {
    static create(username, password, id, avatar, integrationId) {
        return new Promise(async (res, rej) => {
            new profileModel({ username, password: password ? await bcrypt.hash(password, 10) : undefined, userId: id, avatar: avatar ? { url: avatar } : undefined, integrationId }).save().then(res).catch((error) => {
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

    static getProfileByUserId(id) {
        return profileModel.findOne({ userId: id });
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

    static async generateUnsedUsername(username) {
        let i = 0;
        while (await Profile.usernameExists(username) && i < 10) {
            username += Math.floor(Math.random() * 10);
            i++;
        }
        if (i === 10) throw new Error();
        return username;
    }
}

module.exports = { Profile };