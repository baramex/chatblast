import { api } from ".";

export function fetchProfile(id) {
    return api("/profile/" + id, "GET");
}

export function fetchBadges(id) {
    return api("/profile/" + id + "/badges", "GET");
}