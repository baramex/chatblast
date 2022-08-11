import { deleteCookie, getCookie } from "../utils/cookie";

export function handleLogin() {

}

export function handleLogout() {

}

export function isLogged() {
    return sessionStorage.getItem("id") && getCookie("token");
}

export function resetSession() {
    sessionStorage.clear();
    deleteCookie("token");
    deleteCookie("id");
}