import { api } from ".";
import { getCookie } from "../utils/cookie";
import { INTEGRATIONS_TYPE } from "./integration";

export const USERS_TYPE = {
    DEFAULT: 0,
    ANONYME: 1,
    OAUTHED: 2
};

export function loginUser(username, password) {
    return api("/login", "post", { username, password });
}

export async function registerUser(username, password, avatar) {
    const res = await api("/profile", "post", { username, password });

    if (avatar) {
        await uploadAvatar(avatar);
    }

    return res;
}

export function uploadAvatar(file) {
    const formData = new FormData();

    formData.append('avatar', file);
    return api("/profile/@me/avatar", "put", formData, { "Content-Type": "multipart/form-data" });
}

export function logoutUser() {
    return api("/profile", "delete");
}

export function fetchUser() {
    return api("/profile/@me", "get")
}

export function fetchOnline() {
    return api("/profiles/online", "get")
}

export function isLogged() {
    return !!getCookie("token");
}

export async function isLoggedIntegration(integration) {
    try {
        if (!integration) return false;

        if (isNaN(Number.parseInt(sessionStorage.getItem("type")))) {
            const profile = await fetchUser();
            sessionStorage.setItem("id", profile.id);
            sessionStorage.setItem("username", profile.username);
            sessionStorage.setItem("type", profile.type);
            return true;
        }
        else {
            const type = Number(sessionStorage.getItem("type"));

            if (integration && integration.type === INTEGRATIONS_TYPE.ANONYMOUS_AUTH && type === USERS_TYPE.OAUTHED) return false;
            else if (integration && integration.type === INTEGRATIONS_TYPE.CUSTOM_AUTH && type !== USERS_TYPE.OAUTHED) return false;

            if (type === USERS_TYPE.DEFAULT) return !!getCookie("token");
            else if (type === USERS_TYPE.ANONYME || type === USERS_TYPE.OAUTHED) return !!getCookie(integration?.id + "-token");
        }
    } catch (error) {
        return false;
    }
}

export function resetSession() {
    sessionStorage.clear();
}