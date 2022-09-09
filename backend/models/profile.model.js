const { Schema, model, Types } = require("mongoose");
const bcrypt = require('bcrypt');
const { default: isURL } = require("validator/lib/isURL");
const { default: isDataURI } = require("validator/lib/isDataURI");
const { Session } = require("./session.model");
const { Integration, INTEGRATIONS_TYPE } = require("./integration.model");

const USERS_TYPE = {
    DEFAULT: 0,
    ANONYME: 1,
    OAUTHED: 2
};
const USERNAMES_NOT_ALLOWED = ["system"];
const FIELD_REGEX = /^[a-z0-9]{1,32}$/;

const profileSchema = new Schema({
    userId: { type: String },
    username: { type: String, required: true, validate: FIELD_REGEX },
    password: { type: String },
    integrationId: { type: Types.ObjectId },
    avatar: { type: { flag: String, extention: String, url: { type: String, validate: (e) => isURL(e) || isDataURI(e) }, _id: false }, default: { flag: "", extention: "", url: "" } },
    type: { type: Number, default: USERS_TYPE.DEFAULT, min: 0, max: Object.values(USERS_TYPE).length - 1 },
    date: { type: Date, default: Date.now }
});

profileSchema.path("username").validate(async function (v) {
    return (this.isNew ? !(await Profile.usernameExists(this.type, v, this.integrationId)) : true) && !USERNAMES_NOT_ALLOWED.includes(v);
});

profileSchema.path("userId").validate(async function (v) {
    return (v && this.isNew) ? !await profileModel.exists({ userId: v }) : true;
});

const profileModel = model("Profile", profileSchema, "profiles");

class Profile {
    static create(username, password, id, avatar, integrationId, type) {
        return new Promise(async (res, rej) => {
            new profileModel({ username, password: password ? await bcrypt.hash(password, 10) : undefined, userId: id, avatar: avatar ? { url: avatar } : undefined, integrationId, type }).save().then(res).catch((error) => {
                if (error.code == 11000 && error.keyPattern.username) rej(new Error("Un compte est déjà asssocié à ce nom d'utilisateur."));
                else rej(error);
            });
        });
    }

    static usernameExists(type, username, integrationId) {
        return type === USERS_TYPE.DEFAULT ? profileModel.exists({ username }) : profileModel.findOne({ username, integrationId });
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
        if (!profile.password) return false;
        if (await bcrypt.compare(password, profile.password)) return profile;
        return false;
    }

    static getProfileByToken(token) {
        return profileModel.findOne({ token });
    }

    static getUsernamesByIds(ids) {
        return profileModel.find({ _id: { $in: ids } }, { username: true });
    }

    static async generateUnsedUsername(type, username, integrationId) {
        let i = 0;
        while (await Profile.usernameExists(type, username, integrationId) && i < 10) {
            username += Math.floor(Math.random() * 10);
            i++;
        }
        if (i === 10) throw new Error();
        return username;
    }
}

class ProfileMiddleware {
    static async checkUserLogin(cookies) {
        if (!cookies) throw new Error();
        const cookieName = (ObjectId.isValid(id) && cookies[id + "-token"]) ? id + "-token" : "token";

        const token = cookies[cookieName];
        if (!token) throw new Error();

        const session = await Session.getSessionByToken(token);
        if (!session) throw new Error({ cookieName });

        const profile = await Profile.getProfileById(session.profileId);
        if (!profile) throw new Error({ cookieName });
        if (cookieName === "token" && profile.type !== USERS_TYPE.DEFAULT) throw new Error();

        const integration = await Integration.getById(id);
        if (!integration && cookieName.endsWith("-token")) throw new Error({ cookieName });
        if (integration && profile.type !== USERS_TYPE.OAUTHED && !integration._id.equals(profile.integrationId)) throw new Error({ cookieName });
        if (integration && integration.type === INTEGRATIONS_TYPE.ANONYMOUS_AUTH && profile.type === USERS_TYPE.OAUTHED) throw new Error({ cookieName });
        if (integration && integration.type === INTEGRATIONS_TYPE.CUSTOM_AUTH && profile.type === USERS_TYPE.ANONYME) throw new Error({ cookieName });
        if (!integration && profile.type !== USERS_TYPE.DEFAULT) throw new Error({ cookieName });
    }

    static async checkUserLoginExpress(req, res, next) {
        try {
            await ProfileMiddleware.checkUserLogin(req.cookies);
            next();
        } catch (error) {
            if (error.cookieName) res.clearCookie(cookieName, { sameSite: "none", secure: "true" });
            res.sendStatus(401);
        }
    }
}

module.exports = { Profile, USERS_TYPE, FIELD_REGEX, ProfileMiddleware };