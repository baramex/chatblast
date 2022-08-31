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

export function sendMarkAsRead() {
    return api("/messages/view/all", "put");
}

let viewToSend = [];
export function addToViewToSend(id) {
    viewToSend.push(id);
}

let messageToView = [];
export function addToMessageToView(id) {
    messageToView.push(id);
}

let lastUpdateViewMessage = 0;
export async function sendViews(messages, setUnread, setMessages) {
    if (new Date().getTime() - lastUpdateViewMessage < 1000) return setTimeout(() => sendViews(messages, setUnread, setMessages), new Date().getTime() - lastUpdateViewMessage);

    try {
        let curr = [...viewToSend, ...messageToView];
        if (!curr || curr.length === 0) return;

        const ephemerals = curr.filter(a => !messages || messages.find(b => b._id === a)?.ephemeral);
        if (ephemerals.length > 0) {
            setUnread(prev => Math.max((prev || 0) - ephemerals.length, 0));
            setMessages(prev => {
                if (!prev) return;
                return [...prev.map(a => {
                    if (ephemerals.includes(a._id)) return { ...a, isViewed: true };
                    return a;
                })];
            });
            viewToSend = viewToSend.filter(a => !ephemerals.includes(a));
            messageToView = messageToView.filter(a => !ephemerals.includes(a));
            curr = curr.filter(a => !ephemerals.includes(a));
            if (curr.length === 0) return;
        }

        await setViewed(curr);

        viewToSend = viewToSend.filter(a => !curr.includes(a));
        messageToView = messageToView.filter(a => !curr.includes(a));
    } catch (error) { console.error(error) }

    lastUpdateViewMessage = new Date().getTime();
}