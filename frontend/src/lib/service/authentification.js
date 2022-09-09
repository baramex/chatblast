import { api } from ".";
import { getCookie } from "../utils/cookie";

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
        const formData = new FormData();

        formData.append('avatar', avatar);
        await api("/profile/@me/avatar", "put", formData, { "Content-Type": "multipart/form-data" });
    }

    return res;
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

export function isLogged(integrationId) {
    return getCookie(integrationId ? integrationId + "-token" : "token") ? true : false;
}

export function resetSession() {
    sessionStorage.clear();
}