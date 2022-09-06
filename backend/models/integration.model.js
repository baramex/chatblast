const { ObjectId } = require("mongodb");
const { Schema, model, Types } = require("mongoose");

const TOKEN_PLACES_TYPE = {
    AUTHORIZATION: 0,
    URLENCODED: 1,
    QUERY: 2,
};
const INTEGRATION_STATES_TYPE = {
    INACTIVE: 0,
    ACTIVE: 1,
    ERRORED: 2,
};
const INTEGRATIONS_TYPE = {
    CUSTOM_AUTH: 0,
    ANONYMOUS_AUTH: 1,
};

const integrationSchema = new Schema({
    owner: { type: Types.ObjectId, required: true },
    name: { type: String, validate: /^[a-z-0-9]{1,32}$/, default: () => "apps-" + String(Math.floor((Math.random() * 1000))).padStart(3, "0"), required: true },
    options: {
        type: {
            domain: { type: String, maxlength: 128, validate: /^https?:\/\/(?!\.)(\.?(?!-)([a-z]|-|[0-9])*(?<!(-|\.)))+\.([a-z]){2,24}$/, required: true },
            verifyAuthToken: {
                type: {
                    route: { type: String, maxlength: 128, validate: /^https?:\/\/(?!\.)(\.?(?!-)([a-z]|-|[0-9])*(?<!(-|\.)))+\.([a-z]){2,24}(\/[a-z0-9-!"$'()*+,:;<=>@\[\\\]^_`{\|}~\.]*)*$/, required: true },
                    apiKey: String,
                    token: {
                        type: {
                            place: { type: Number, min: 0, max: Object.values(TOKEN_PLACES_TYPE).length - 1, required: true },
                            key: { type: String, validate: /^[a-z-]{1,64}$/i, required: true },
                            _id: false
                        },
                        required: true
                    },
                    _id: false
                }
            },
            _id: false
        },
    },
    state: { type: Number, min: 0, max: Object.values(INTEGRATION_STATES_TYPE).length - 1, default: INTEGRATION_STATES_TYPE.INACTIVE, required: true },
    type: { type: Number, min: 0, max: Object.values(INTEGRATIONS_TYPE).length - 1, required: true },
    date: { type: Date, default: Date.now }
});

integrationSchema.path("name").validate(async function (v) {
    return !await IntegrationModel.exists({ owner: this.owner, name: v });
});

integrationSchema.path("options.verifyAuthToken").validate(function (v) {
    return this.type === "custom-auth" ? !!v : true;
});

integrationSchema.path("options.verifyAuthToken.route").validate(function (v) {
    const url = new URL(v);
    return url.protocol + "//" + url.hostname.split(".").reverse().splice(0, 2).reverse().join(".") === this.parent().domain.replace("www.", "");
});

const IntegrationModel = model("Integration", integrationSchema, "integrations");

class Integration {
    static create(ownerId, name, type, options) {
        return new IntegrationModel({ owner: ownerId, name, type, options }).save();
    }

    /**
     * 
     * @param {Types.ObjectId} id 
     * @returns 
     */
    static getById(id) {
        return IntegrationModel.findById(id).where("state", INTEGRATION_STATES_TYPE.ACTIVE);
    }

    /**
     * 
     * @param {Types.ObjectId} ownerId 
     * @returns 
     */
    static getByOwner(ownerId) {
        return Integration.find({ owner: ownerId });
    }
}

class IntegrationMiddleware {
    static async parseIntegration(req, res, next) {
        try {
            const id = req.headers.referer.includes(process.env.HOST + "/integrations/") ? req.headers.referer?.split("/").pop() : undefined;
            if (id && !ObjectId.isValid(id)) throw new Error("Requête invalide.");

            req.integration = await Integration.getById(new ObjectId(id));

            if (req.profile && req.integration) {
                if (!req.profile.integrationId?.equals(req.integration._id)) return res.status(403).send("Non autorisé.");
            }

            return next();
        } catch (error) {
            console.error(error);
            res.status(400).send(error.message || "Erreur inattendue");
        }
    }
}

module.exports = { Integration, IntegrationMiddleware, INTEGRATIONS_TYPE, TOKEN_PLACES_TYPE };