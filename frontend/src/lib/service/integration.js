const { api } = require(".");

export const INTEGRATIONS_TYPE = {
    CUSTOM_AUTH: 0,
    ANONYMOUS_AUTH: 1,
};

export function fetchIntegration(id) {
    return api("/integration/" + id, "GET");
}

export function oauthProfile(id, token) {
    return api("/integration/" + id + "/profile/oauth", "POST", undefined, { authorization: "Token " + token });
}