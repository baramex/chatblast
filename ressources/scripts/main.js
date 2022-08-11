// main script
const socket = io();
const unread = document.getElementById("unread");
let inPage = true;
let documentLoaded = false;
let allMessageFetched = false;

let messageToView = [];
let viewMessagesToSend = [];
const messageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting == true) {
            let id = entry.target.id.replace("m-", "");
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

let lastUpdateViewMessage = 0;
function updateViewMessages() {
    if (new Date().getTime() - lastUpdateViewMessage < 1000) return setTimeout(updateViewMessages, new Date().getTime() - lastUpdateViewMessage);

    let curr = [...viewMessagesToSend];
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

if ((!sessionStorage.getItem("username") || !sessionStorage.getItem("id") || !sessionStorage.getItem("unread")) && getCookie("token")) {
    api("/profile/@me", "get", undefined, true).then(res => {
        sessionStorage.setItem("username", res.username);
        sessionStorage.setItem("id", res.id);
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
    if (!reverse) messages.reverse();
    var s = messageContainer.scrollHeight;
    messages.forEach(message => {
        pushMessage(message._id, message.author, message.content, message.views, message.isViewed, new Date(message.date), false, reverse);
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
socket.on("message.delete", id => {
    var mes = document.getElementById("m-" + id);
    if (mes) {
        if (mes.classList.contains("unread")) {
            if (viewMessagesToSend.findIndex(a => a.id == id)) viewMessagesToSend.splice(viewMessagesToSend.findIndex(a => a.id == id), 1);
            if (messageToView.includes(id)) messageToView.splice(messageToView.indexOf(id), 1);

            sessionStorage.setItem("unread", sessionStorage.getItem("unread") - 1);
            updateUnread();
        }
        mes.remove();
    }
});

socket.on("message.send", data => {
    var message = data.content;

    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    var profile = typing.findIndex(a => a.id == data.author.id);
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
        if (typing.some(a => a.id == res.id)) return;
        typing.push({ id: res.id, username: res.username })
    } else {
        var profile = typing.findIndex(a => a.id == res.id);
        if (profile == -1) return;
        typing.splice(profile, 1);
    }

    sessionStorage.setItem("typing", JSON.stringify(typing));
    updateTyping();
});

socket.on("messages.view", data => {
    data.forEach(({ id, views }) => {
        var el = document.body.querySelector(`div#m-${id} span.views`);
        if (el) el.innerText = views;
    });
});

socket.on("profile.join", data => {
    var id = data.id;
    var username = data.username;

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    if (online.some(a => a.id == id)) {
        online.push({ id, username });
        sessionStorage.setItem("online", JSON.stringify(online));
        updateOnline();
    }
});

socket.on("profile.leave", data => {
    var id = data.id;

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    var profile = online.findIndex(a => a.id == id);
    if (profile == -1) return;
    online.splice(profile, 1);
    sessionStorage.setItem("online", JSON.stringify(online));
    updateOnline();

    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    var profile = typing.findIndex(a => a.id == id);
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
            if (doc && doc.classList.contains("unread")) {
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
        img.src = "/profile/" + (user.id == sessionStorage.getItem("id") ? "@me" : user.id) + "/avatar";
        img.classList.add("me-2", "contrast");
        img.width = "60";
        var span = document.createElement("span");
        span.classList.add("fs-5");
        span.innerText = user.username;

        td.append(img, span);
        tr.appendChild(td);

        onlineTable.appendChild(tr);
    });
}

const typingText = document.getElementById("typing");
function updateTyping() {
    var typing = JSON.parse(sessionStorage.getItem("typing") || "[]");
    typing = typing.filter(a => a.id != sessionStorage.getItem("id"));
    if (typing == 0) return typingText.innerHTML = ""
    typingText.innerHTML = `${typing.map(a => a.username).join(", ")} ${typing.length > 1 ? "sont" : "est"} en train d'écrire...`;
}

function updateUnread() {
    var n = sessionStorage.getItem("unread") || 0;

    if (n < 0) {
        sessionStorage.setItem("unread", 0);
        n = 0;
    }

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
    if (document.getElementById("m-" + id)) return;

    if (nomes) {
        nomes.remove();
        nomes = undefined;
    }

    let isSystem = author.username == "SYSTEM";
    var isMy = author.id == sessionStorage.getItem("id");

    let div = document.createElement("div");
    div.id = "m-" + id;
    div.classList.add("pb-2", "my-4", "rounded-3", "border", "border-secondary", "message");
    if (isMy) div.classList.add("bg-light");
    if (!isViewed) div.classList.add("unread");

    let div1 = document.createElement("div");
    div1.classList.add("d-flex", "justify-content-between", "username-container");

    let div2 = document.createElement("div");
    div2.classList.add("d-flex", "align-items-center", "border-dashed", "username");
    div2.style.borderBottomRightRadius = "var(--bs-border-radius-lg)";

    let img = document.createElement("img");
    img.classList.add("mx-2", "contrast");
    img.width = 30;
    img.src = isSystem ? "/images/system.png" : "/profile/" + (isMy ? "@me" : author.id) + "/avatar";
    img.alt = "avatar";

    // author
    let p = document.createElement("p");
    p.classList.add("pe-3", "ps-1", "py-1", "fs-5", "m-auto");
    p.innerText = author.username;

    // icons & date
    var divIcons = document.createElement("div");
    divIcons.classList.add("d-flex", "align-items-center", "me-2", "icons");
    divIcons.style.gap = "10px";

    let spanDate = document.createElement("span");
    spanDate.classList.add("date");
    spanDate.innerText = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

    var viewsDiv = document.createElement("div");
    viewsDiv.innerHTML = `<span class="views">${views}</span><img class="ms-1" style="vertical-align: sub;" width=20 src="/images/eye.png">`;
    divIcons.append(viewsDiv, spanDate);

    // message
    let divMessage = document.createElement("div");
    divMessage.classList.add("d-flex");

    let p2 = document.createElement("p");
    p2.classList.add("my-4", "mx-4", "fs-5", "text-break", "text");
    p2.style.flexGrow = 1;
    if (isSystem) p2.innerHTML = message;
    else p2.innerText = message;
    divMessage.append(p2);

    if (isMy) {
        // options
        let divOptions = document.createElement("div");
        divOptions.classList.add("d-flex", "flex-column");
        divOptions.style.gap = "5px";

        let buttonDel = document.createElement("button");
        buttonDel.classList.add("border-0", "bg-transparent");
        buttonDel.innerHTML = `<img width=20 src="/images/bin.png">`;
        buttonDel.onclick = () => deleteMessage(id);
        divOptions.append(buttonDel);
        divMessage.append(divOptions);
    }

    div.appendChild(div1);
    div1.appendChild(div2);
    div2.append(img, p);
    div1.append(divIcons);
    div.appendChild(divMessage);

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
        if (scroll > height - 666 - 100) {
            messageContainer.parentElement.scrollTo({ top: height, behavior: "smooth" });
        }

        messageObserver.observe(div);
    }
}

function deleteMessage(id) {
    showConfirm("Êtes-vous sûr de vouloir supprimer le message ?", () => {
        api("/message/" + id, "delete", undefined, true, undefined, "Message supprimé !");
    });
}

const CALL_STATES = {
    "INIT": 0,
    "RINGING": 1,
    "ANSWERED": 2,
    "ENDED": 3,
    "ERROR": 4,
    "BUSY": 6
};

const audio = document.getElementById("call");

class Call {
    constructor(state, caller = undefined, remoteRTCMessage = undefined) {
        this.state = state;
        if (caller) this.caller = caller;
        if (remoteRTCMessage) this.remoteRTCMessage = remoteRTCMessage;
    }

    async start(callee) {
        if (this.state != CALL_STATES.INIT) throw new Error("Call already started");

        await this.createPeerConnection();
        const sessionDescription = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(sessionDescription);

        socket.emit("call", { callee, RTCMessage: sessionDescription });
        this.caller = sessionStorage.getItem("id");
        this.callee = callee;
        this.state = CALL_STATES.RINGING;

        console.log("start call");
    }

    async createPeerConnection() {
        this.mediaStream = await this.getMediaStream();
        if (!this.mediaStream) throw new Error("No media stream");

        const config = {
            iceServers: [
                {
                    "urls": ["stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302"]
                },
                {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                }
            ]
        }

        this.peerConnection = new RTCPeerConnection(config);
        this.peerConnection.onaddstream = e => {
            audio.srcObject = e.stream;
        };
        this.peerConnection.onicecandidate = e => {
            if (e.candidate) {
                socket.emit("call.candidate", {
                    label: e.candidate.sdpMLineIndex,
                    id: e.candidate.sdpMid,
                    candidate: e.candidate.candidate,
                    caller: this.caller,
                    callee: this.callee
                });
            }
        };

        this.peerConnection.addStream(this.mediaStream);
    }

    getMediaStream() {
        return navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    }

    async answer() {
        if (this.state != CALL_STATES.RINGING) throw new Error("Call not ringing");

        await this.createPeerConnection();
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(this.remoteRTCMessage));
        const sessionDescription = await this.peerConnection.createAnswer();
        this.peerConnection.setLocalDescription(sessionDescription);

        socket.emit("call.answer", { caller: this.caller, RTCMessage: sessionDescription });
        this.state = CALL_STATES.ANSWERED;

        console.log("answer call");
    }

    answered() {
        if (this.state != CALL_STATES.RINGING && this.state != CALL_STATES.ANSWERED) throw new Error("Call not ringing or answered");
        this.state = CALL_STATES.ANSWERED;

        console.log("answered call");
    }

    busy() {
        if (this.state != CALL_STATES.RINGING) throw new Error("Call not ringing");
        this.state = CALL_STATES.BUSY;

        console.log("busy call");
    }
}

let call;
socket.on("call.income", data => {
    console.log("ringing");
    if (call) return;
    call = new Call(CALL_STATES.RINGING, data.caller, data.RTCMessage);
    call.callee = sessionStorage.getItem("id");
});

socket.on("call.answered", async data => {
    if (call) {
        call.answered();

        if (call.caller == sessionStorage.getItem("id")) {
            call.peerConnection.setRemoteDescription(new RTCSessionDescription(data.RTCMessage));
        }
        else {
            for (const candidate of data.candidates) {
                await call.peerConnection.addIceCandidate(new RTCIceCandidate({
                    sdpMLineIndex: candidate.label,
                    candidate: candidate.candidate
                }));
            }
        }
    }
});

socket.on("call.busy", () => {
    if (call) call.busy();
    call = undefined;
});

document.getElementById("call-form").addEventListener("submit", e => {
    e.preventDefault();
    if (!call) {
        call = new Call(CALL_STATES.INIT);
        call.start(e.target.id.value);
    }
});

document.getElementById("answer").addEventListener("click", e => {
    if (call) call.answer();
});

/*const audio = new Audio();
audio.autoplay = true;
let burl = "";
let firstBuffer = 0;
socket.on("voice", async buffer => {
    if (!firstBuffer) firstBuffer = buffer;
    const blob = new Blob([firstBuffer, buffer], { type: "audio/webm" });

    if (burl) URL.revokeObjectURL(burl);
    const url = URL.createObjectURL(blob);

    audio.src = url;
    audio.volume = 1;
    audio.currentTime = burl ? 0.5 : 0;

    burl = url;
});

async function getLocalStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorder.start();

    setInterval(() => {
        recorder.requestData();
    }, 500);

    recorder.ondataavailable = async e => {
        socket.emit("voice", { buffer: e.data, receiver: sessionStorage.getItem("id") });
    };
}

getLocalStream().catch(console.error);*/