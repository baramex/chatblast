const { api } = require(".");

export function fetchIntegration(id) {
    return api("/integration/" + id, "GET");
}

export function oauthProfile(id, token) {
    return api("/integration/" + id + "/profile/oauth", "POST", undefined, { authorization: "Token " + token });
}