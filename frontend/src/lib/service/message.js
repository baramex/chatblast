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

let viewToSend = [];
export function addToViewToSend(id) {
    viewToSend.push(id);
}

let lastUpdateViewMessage = 0;
export async function sendViews(setUnread, setMessages) {
    if (new Date().getTime() - lastUpdateViewMessage < 1000) return setTimeout(() => sendViews(setUnread, setMessages), new Date().getTime() - lastUpdateViewMessage);

    try {
        console.log(viewToSend);
        let curr = [...viewToSend];
        if (!curr || curr.length === 0) return;

        await setViewed(curr);

        setUnread(prev => prev - curr.length);
        setMessages(prev => prev.map(message => curr.includes(message._id) ? { ...message, isViewed: true } : message));
    } catch (error) { }

    lastUpdateViewMessage = new Date().getTime();
}