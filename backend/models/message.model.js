const { Schema, model, default: mongoose } = require("mongoose");
const { io } = require("../server");
const { ObjectId } = mongoose.Types;

const messageSchema = new Schema({
    author: { type: { username: String, id: ObjectId, _id: false }, required: true },
    content: { type: String, required: true, validate: /^.{1,512}$/ },
    deleted: { type: Boolean, default: false },
    edits: { type: [{ content: { type: String, required: true }, date: { type: Date, default: new Date() } }], default: [] },
    views: { type: [ObjectId], default: [] },
    date: { type: Date, default: Date.now }
});

messageSchema.post("updateMany", async function (doc, next) {
    if (doc.modifiedCount >= 1) {
        var messages = await Message.getMessagesByIds(this.getQuery()._id.$in);
        (await io.to("authenticated").fetchSockets()).forEach(socket => {
            socket.emit("messages.view", messages.map(a => ({ id: a._id, views: a.views.length, isViewed: a.views.includes(socket.profileId) })));
        });
    }
    next();
});
messageSchema.pre("save", function (next) {
    if (!this.isNew && this.isModified("deleted") && this.deleted == true) {
        io.to("authenticated").emit("message.delete", this._id);
    }
    next();
});
messageSchema.post("validate", (doc, next) => {
    if (doc.isNew) {
        io.to("authenticated").emit("message.send", { _id: doc._id, author: doc.author, content: doc.content, date: doc.date, views: 0, isViewed: false });
    }
    next();
});

const messageModel = model("Message", messageSchema, "messages");

class Message {
    /**
     * 
     * @param {*} profile 
     * @param {String} content 
     */
    static create(profile, content) {
        return new messageModel({ author: { id: profile._id, username: profile.username }, content }).save();
    }

    /**
     * 
     * @param {ObjectId} id 
     */
    static getById(id) {
        return messageModel.findById(id).where("deleted", false);
    }

    /**
     * 
     * @param {ObjectId} author 
     * @param {ObjectId} id 
     * @param {String} content 
     * @returns 
     */
    static async editMessage(author, id, content) {
        var doc = await Message.getById(id);
        if (doc.author.id != author) throw new Error("Vous ne pouvez pas modifier un message ne vous appartenant pas.");
        doc.edits.push({ content: doc.message });
        doc.message = content;
        return doc.save({ validateBeforeSave: true });
    }

    /**
     * 
     * @param {*} profile 
     * @param {Number} from 
     * @param {Number} number 
     */
    static async getMessages(profile, from, number) {
        if (!from || isNaN(from) || from < 0) throw new Error("La valeur de départ doit être supérieure à 0.");
        if (number > 50) throw new Error("Le nombre de message ne peut pas excéder 50.");
        return Message.getMessagesFields(profile, await messageModel.find({}).sort({ date: -1 }).where("deleted", false).skip(from).limit(number));
    }

    /**
     * 
     * @param {ObjectId[]} ids 
     */
    static getMessagesByIds(ids) {
        return messageModel.find({ _id: { $in: ids } });
    }

    static getMessagesFields(profile, docs) {
        return docs.map(a => Message.getMessageFields(profile, a));
    }

    static getMessageFields(profile, doc) {
        return { _id: doc._id, author: doc.author, content: doc.content, date: doc.date, views: doc.views.length, isViewed: (doc.views.includes(profile._id) || doc.date.getTime() < profile.date.getTime()) };
    }

    static getUnreadCount(profile) {
        return messageModel.find({ views: { $not: { $all: [profile._id] } }, date: { $gt: profile.date }, deleted: false }).count();
    }

    static getUnread(profile) {
        return messageModel.find({ views: { $not: { $all: [profile._id] } }, date: { $gt: profile.date }, deleted: false });
    }

    /**
     * 
     * @param {ObjectId[]} ids
     * @param {ObjectId} id
     */
    static addViewToMessages(ids, id) {
        return messageModel.updateMany({ _id: { $in: ids } }, { $addToSet: { views: id } });
    }
}

module.exports = { Message };