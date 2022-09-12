import { api } from ".";

export function fetchProfile(id) {
    return api("/profile/" + id, "GET");
}