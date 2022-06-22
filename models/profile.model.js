const { Schema, model } = require("mongoose");
const bcrypt = require('bcrypt');

const profileSchema = new Schema({
    username: {
        type: String,
        required: true,
        validate: /^[a-z]{1,32}$/,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: {
            flag: String, extention: String,
            _id: false
        },
        default: { flag: "", extention: "" },
    },
    role: {
        type: Number,
        default: 0
    }
});



const profileModel = model("Profile", profileSchema, "profiles");

class Profile {

    static create(username, password) {
        return new Promise((res, rej) => {
            bcrypt.hash(password, 10, function (err, hash) {
                if (err) rej(err);
                new profileModel({ username, password: hash }).save().then(res).catch((error) => {
                    if (error.code == 11000 && error.keyPattern.username) rej(new Error("Un compte est déjà asssocié à ce nom d'utilisateur."));
                    else rej(error);
                });
            });
        });
    }

    static getProfileById(id) {
        return profileModel.findById(id);
    }

    static async check(username, password) {
        var profile = await profileModel.findOne({ username });
        if (bcrypt.compare(password, profile.password)) return profile._id;
        else return false;
    }

    static getProfileByToken(token) {
        return profileModel.findOne({ token });
    }
}

module.exports = { Profile };