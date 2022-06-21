const { Schema, model, default: mongoose } = require("mongoose");
const { ObjectId } = mongoose.Types;

const messageSchema = new Schema({
    author: { type: { username: String, id: ObjectId, _id: false }, required: true },
    content: { type: String, required: true, validate: /^.{1,256}$/ },
    deleted: { type: Boolean, default: false },
    edits: { type: [{ content: { type: String, required: true }, date: { type: Date, default: new Date() } }], default: [] },
    views: { type: [ObjectId], default: [] },
    date: { type: Date, default: Date.now }
});

const messageModel = model("Message", messageSchema, "messages");

class Message {
    /**
     * 
     * @param {{ username: String, id: ObjectId }} author 
     * @param {String} content 
     */
    static create(author, content) {
        return new messageModel({ author, content }).save();
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
     * @param {ObjectId} id 
     * @param {String} content 
     * @returns 
     */
    static async editMessage(id, content) {
        var doc = await Message.getById(id);
        doc.edits.push({ content: doc.message });
        doc.message = content;
        return doc.save();
    }

    /**
     * 
     * @param {Number} from 
     * @param {Number} number 
     */
    static async getMessages(from, number) {
        if (!from || isNaN(from) || from < 0) throw new Error("La valeur de départ doit être supérieure à 0.");
        if (number > 50) throw new Error("Le nombre de message ne peut pas excéder 50.");
        return Message.getMessagesFields(await messageModel.find({}).where("deleted", false).skip(from).limit(number));
    }

    static getMessagesFields(docs) {
        return docs.map(a => Message.getMessageFields(a));
    }

    static getMessageFields(doc) {
        return { _id: doc._id, author: doc.author, content: doc.content, deleted: doc.deleted, date: doc.date, views: doc.views.length };
    }

    /**
     * 
     * @param {ObjectId} id 
     */
    static async deleteMessage(id) {
        var doc = await Message.getById(id);
        doc.deleted = true;
        return doc.save();
    }

    /**
     * 
     * @param {ObjectId} id
     * @param {ObjectId[]} ids 
     */
    static addViews(id, ids) {
        var doc = Message.getById(id);
        doc.setUpdate({ $addToSet: { views: ids } });
        return doc.findOneAndUpdate(doc.getQuery(), doc.getUpdate(), { new: true });
    }

    /**
     * 
     * @param {ObjectId[]} ids
     * @param {ObjectId} id
     */
    static async addViewToMessages(ids, id) {
        // update socket (event schema)
        return messageModel.updateMany({ _id: { $in: ids } }, { $addToSet: { views: id } });
    }
}

module.exports = { Message };