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
export async function sendViews(setUnread, setMessages) {
    if (new Date().getTime() - lastUpdateViewMessage < 1000) return setTimeout(() => sendViews(setUnread, setMessages), new Date().getTime() - lastUpdateViewMessage);

    try {
        let curr = [...viewToSend, ...messageToView];
        if (!curr || curr.length === 0) return;

        await setViewed(curr);

        setUnread(prev => Math.max(0, prev - curr.length));
        setMessages(prev => [...prev.map(message => curr.includes(message._id) ? { ...message, isViewed: true } : message)]);
        
        viewToSend = viewToSend.filter(a => !curr.includes(a));
        messageToView = messageToView.filter(a => !curr.includes(a));
    } catch (error) { console.error(error) }

    lastUpdateViewMessage = new Date().getTime();
}