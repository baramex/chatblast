// main script
const socket = io();
const unread = document.getElementById("unread");
var inPage = true;
var documentLoaded = false;
var allMessageFetched = false;

var messageToView = [];
var viewMessagesToSend = [];
const messageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting == true) {
            var id = entry.target.id.replace("m-", "");
            if (inPage) {
                viewMessagesToSend.push({ id, element: entry.target });
            }
            else {
                messageToView.push(id);
                messageObserver.unobserve(entry.target);
            }
        }
    });
    updateViewMessages();
}, { threshold: [0] });

var lastUpdateViewMessage = 0;
function updateViewMessages() {
    if (new Date().getTime() - lastUpdateViewMessage < 1000) return setTimeout(updateViewMessages, new Date().getTime() - lastUpdateViewMessage);

    var curr = [...viewMessagesToSend];
    if (!curr || curr.length == 0) return;
    api("/messages/view", "put", { ids: curr.map(a => a.id) });

    curr.forEach(a => {
        messageObserver.unobserve(a.element);

        if (a.element.classList.contains("unread")) {
            sessionStorage.setItem("unread", Number(sessionStorage.getItem("unread")) - 1);
            a.element.classList.remove("unread");
            updateUnread();
        }
    });
    viewMessagesToSend = viewMessagesToSend.filter(a => !curr.find(b => b.id != a.id));

    lastUpdateViewMessage = new Date().getTime();
}

if ((!localStorage.getItem("username") || !localStorage.getItem("id") || !sessionStorage.getItem("unread")) && getCookie("token")) {
    api("/profile/@me", "get", undefined, true).then(res => {
        localStorage.setItem("username", res.username);
        localStorage.setItem("id", res.id);
        sessionStorage.setItem("unread", res.unread);
        updateUnread();
    });
}
update();
updateUnread();
api("/messages?from=0", "get", undefined, true).then(res => {
    fetched(res, true);
});

function fetched(messages, loaded = false, reverse = false) {
    if (!documentLoaded) return setTimeout(() => fetched(messages, loaded), 10);
    if (loaded) {
        document.body.querySelectorAll("[toshow]").forEach(a => a.hidden = false);
        document.body.querySelectorAll("[toremove]").forEach(a => a.remove());
    }

    if (messages.length == 0) allMessageFetched = true;
    if (reverse) messages = messages.reverse();
    var s = messageContainer.scrollHeight;
    messages.forEach(message => {
        pushMessage(message._id, message.author, message.content, message.views, message.isViewed, new Date(message.date), false, true);
    });
    var news = messageContainer.scrollHeight;

    messageContainer.childNodes.forEach(a => {
        if (messages.find(b => "m-" + b._id == a.id)) {
            messageObserver.observe(a);
        }
    });

    messageContainer.parentElement.scrollTo({ top: news - s });
}

// socket handling
socket.on("message.send", data => {
    var message = data.content;

    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    var profile = typing.indexOf(data.author.username);
    if (profile != -1) {
        typing.splice(profile, 1);
        sessionStorage.setItem("typing", JSON.stringify(typing));
        updateTyping();
    }

    pushMessage(data._id, data.author, message, data.views, false, new Date(data.date), true);
});

socket.on("message.typing", (res) => {
    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    if (res.isTyping) {
        typing.push(res.username)
    } else {
        var profile = typing.indexOf(res.username);
        if (profile == -1) return;
        typing.splice(profile, 1);
    }

    sessionStorage.setItem("typing", JSON.stringify(typing));
    updateTyping();
});

socket.on("messages.view", data => {
    data.forEach(({ _id, views }) => {
        var el = document.body.querySelector(`div#m-${_id} p.views`);
        if (el) el.innerText = "Vu par " + views + " utilisateurs";
    });
});

socket.on("profile.join", data => {
    var username = data.username;

    pushMessage(0, { id: null, username: "SYSTEM" }, `<b>${username}</b> a rejoint la session.`, -1, true, new Date(), true);

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    online.push(username);
    sessionStorage.setItem("online", JSON.stringify(online));
    updateOnline();
});

socket.on("profile.leave", data => {
    var username = data.username;

    pushMessage(0, { id: null, username: "SYSTEM" }, `<b>${username}</b> a quitté la session.`, -1, true, new Date(), true);

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    var profile = online.indexOf(username);
    if (profile == -1) return;
    online.splice(profile, 1);
    sessionStorage.setItem("online", JSON.stringify(online));
    updateOnline();

    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    var profile = typing.indexOf(username);
    if (profile == -1) return;
    typing.splice(profile, 1);
    sessionStorage.setItem("typing", JSON.stringify(typing));
    updateTyping();
});

// events
const messageContainer = document.getElementById("message-container");
messageContainer.parentElement.addEventListener("scroll", ev => {
    if (ev.target.scrollTop < 50 && !pending_request && !allMessageFetched) {
        api("/messages?from=" + messageContainer.childElementCount, "get", undefined, true).then(res => {
            if (res.length == 0 && !document.getElementById("nomoremes")) {
                var p = document.createElement("p");
                p.classList.add("text-center", "fs-6", "text-secondary");
                p.id = "nomoremes";
                p.innerText = "Il n'y a pas d'autres messages";
                messageContainer.prepend(p);
            }

            fetched(res, false, true);
        });
    }
});

document.body.addEventListener("mouseenter", () => {
    if (messageToView.length > 0) {
        api("/messages/view", "put", { ids: messageToView });
        messageToView.forEach(id => {
            var doc = document.getElementById("m-" + id);
            if (doc.classList.contains("unread")) {
                sessionStorage.setItem("unread", sessionStorage.getItem("unread") - 1);
                doc.classList.remove("unread");
                updateUnread();
            }
        });
        messageToView = [];
    }

    inPage = true;
});

document.body.addEventListener("mouseleave", () => {
    inPage = false;
});

window.addEventListener("load", () => {
    documentLoaded = true;
});

const showOnline = document.getElementById("show-online");
showOnline.addEventListener("click", () => {
    showOnline.parentElement.classList.toggle("active");
});

const messageForm = document.getElementById("send-message");
const messageField = document.getElementById("message");
const submitButton = messageForm.querySelector("input[type=submit]");
messageForm.addEventListener("submit", ev => {
    ev.preventDefault();

    var msg = messageField.value.trim();
    if (msg.length == 0) return;

    messageForm.querySelectorAll("input").forEach(a => a.disabled = true);

    api("/message", "put", { content: msg }, true).then(res => {
        messageField.value = "";
    }).finally(() => {
        messageForm.querySelectorAll("input").forEach(a => a.disabled = false);
        messageField.focus();
    });
});

messageField.addEventListener("input", e => {
    if ((e.inputType == "insertText" && e.target.value.length == 1) || e.inputType == "insertFromPaste") {
        api("/typing", "put", { isTyping: true });
    } else if (e.target.value.length == 0) {
        api("/typing", "put", { isTyping: false });
    }
});

// functions
function disconnect() {
    this.disabled = true;
    api("/profile", "delete", undefined, true, undefined, "Déconnecté !", () => document.location.href = "/login").then(() => {
        resetProfile();
    }).catch(() => {
        this.disabled = false;
    });
}

async function update() {
    await api("/profiles/online", "get", undefined, true).then(res => {
        sessionStorage.setItem("online", JSON.stringify(res));

        updateOnline();
    });

    await api("/profiles/typing", "get", undefined, true).then(res => {
        sessionStorage.setItem("typing", JSON.stringify(res));

        updateTyping();
    });

    setTimeout(update, 1000 * 60);
}

const onlineCount = document.getElementById("online-count");
const onlineTable = document.querySelector("#online-container > table");
function updateOnline() {
    var online = JSON.parse(sessionStorage.getItem("online"));

    onlineCount.innerText = online.length + " en ligne";

    onlineTable.innerHTML = "";

    online.forEach((user, i) => {
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.classList.add("py-3", "px-4");
        var img = document.createElement("img");
        img.src = "/images/user.png";
        img.classList.add("me-2", "contrast");
        img.width = "60";
        var span = document.createElement("span");
        span.classList.add("fs-5");
        span.innerText = user;

        td.append(img, span);
        tr.appendChild(td);

        onlineTable.appendChild(tr);
    });
}

const typingText = document.getElementById("typing");
function updateTyping() {
    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    typing = typing.filter(a => a != localStorage.getItem("username"));
    if (typing == 0) return typingText.innerHTML = ""
    typingText.innerHTML = `${typing.join(", ")} ${typing.length > 1 ? "sont" : "est"} en train d'écrire...`;
}

function updateUnread() {
    var n = sessionStorage.getItem("unread") || 0;
    unread.innerText = n;
    if (n > 0) {
        unread.classList.add("warning");
        unread.classList.remove("bg-primary");
        unread.classList.add("bg-danger");
    }
    else {
        unread.classList.remove("warning");
        unread.classList.add("bg-primary");
        unread.classList.remove("bg-danger");
    }
}

var nomes = document.getElementById("nomes");
const sound = new Audio("/sounds/notification.wav");
function pushMessage(id, author, message, views = -1, isViewed, date = new Date(), isNew = false, reverse = false) {
    if (nomes) {
        nomes.remove();
        nomes = undefined;
    }

    let isSystem = author.username == "SYSTEM";

    let div = document.createElement("div");
    div.id = "m-" + id;
    div.classList.add("pb-2", "my-4", "rounded-3", "border", "border-secondary", "message");
    if (!isSystem && id == localStorage.getItem("id")) div.classList.add("bg-light");
    if (!isViewed) div.classList.add("unread");

    let div1 = document.createElement("div");
    div1.classList.add("d-flex", "justify-content-between", "username-container");

    let div2 = document.createElement("div");
    div2.classList.add("d-flex", "align-items-center", "border-dashed", "username");
    div2.style.borderBottomRightRadius = "var(--bs-border-radius-lg)";

    let img = document.createElement("img");
    img.classList.add("mx-2", "contrast");
    img.width = 30;
    img.src = isSystem ? "/images/system.png" : "/images/user.png";
    img.alt = "avatar";

    let p = document.createElement("p");
    p.classList.add("pe-3", "ps-1", "py-1", "fs-5", "m-auto");
    p.innerText = author.username;

    let p1 = document.createElement("p");
    p1.style.float = "right";
    p1.classList.add("mt-2", "mx-2", "date");
    p1.innerText = date.toLocaleTimeString("fr");

    let p2 = document.createElement("p");
    p2.classList.add("my-4", "mx-4", "fs-5", "text-break", "text");
    if (isSystem) p2.innerHTML = message;
    else p2.innerText = message;

    if (views != -1) {
        var p3 = document.createElement("p");
        p3.classList.add("text-end", "mb-2", "me-3", "views");
        p3.innerText = "Vu par " + views + " utilisateurs";
    }

    div.appendChild(div1);
    div1.appendChild(div2);
    div2.append(img, p);
    div1.appendChild(p1);
    div.appendChild(p2);
    if (p3) div.appendChild(p3);

    var scroll = messageContainer.parentElement.scrollTop;
    var height = messageContainer.parentElement.scrollHeight;
    if (reverse) messageContainer.prepend(div);
    else messageContainer.append(div);

    if (isNew) {
        if (inPage) {
            api("/messages/view", "put", { ids: [id] });
            div.classList.remove("unread");
        }
        else {
            sessionStorage.setItem("unread", Number(sessionStorage.getItem("unread")) + 1);
            updateUnread();
        }

        if (!inPage || isSystem) {
            sound.play();
        }

        // 666: height - scroll = 666...
        if (scroll > height - 666 - 50) {
            messageContainer.parentElement.scrollTo({ top: height, behavior: "smooth" });
        }

        messageObserver.observe(div);
    }
}