import { api } from ".";

export function fetchMessages(from) {
    return api('/messages?from=' + from, "get");
}

export function setViewed(ids) {
    return api('/messages/view', "put", { ids });
}

export function fetchTyping() {
    return api('/profiles/typing', "get");
}

export function setMessageTyping(typing) {
    return api('/typing', "put", { isTyping: typing });
}

export function sendMessage(message) {
    return api('/message', "put", { content: message });
}

export function deleteMessageById(id) {
    return api('/message/' + id, "delete");
}