const { Schema, model} = require("mongoose");
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
    }
});

const profileModel = model("Profile", profileSchema, "profiles");

class Profile {

    /**
     * 
     * @ {} username 
     */

    static create(username, password, avatarHash = undefined) {
        return new Promise((res, rej) => {
            bcrypt.hash(password, 10, function(err, hash) {
                if(err) rej(err);
                console.log("ok");
                new profileModel({ username, password: hash, avatarHash }).save().then(res).catch(rej);
            });
        });
    }

    static getProfileById(id) {
        return profileModel.findById(id);
    }

    // static setAvatarHash(avatar) {

    // }
}

module.exports = { Profile };