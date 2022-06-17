const socket = io();

socket.on("message.send", data => {
    var id = data.author.id;
    var username = data.author.username;
    var message = data.message;

    pushMessage(id, username, message, data.count);
});

function pushMessage(id, username, message, transfered = null) {
    if (document.getElementById("nomes")) document.getElementById("nomes").remove();

    let isSystem = username == "SYSTEM";

    let div = document.createElement("div");
    div.classList.add("pb-2", "my-4", "rounded-3", "border", "border-secondary", "message");
    if (!isSystem && id == sessionStorage.getItem("id")) div.classList.add("bg-light");

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
    p.innerText = username;

    let p1 = document.createElement("p");
    p1.style.float = "right";
    p1.classList.add("mt-2", "mx-2", "date");
    p1.innerText = new Date().toLocaleTimeString("fr");

    let p2 = document.createElement("p");
    p2.classList.add("my-4", "mx-4", "fs-5", "text-break", "text");
    if (isSystem) p2.innerHTML = message;
    else p2.innerText = message;

    if (transfered) {
        var p3 = document.createElement("p");
        p3.classList.add("text-end", "mb-2", "me-3");
        p3.innerText = "Transféré à " + transfered + " utilisateurs";
    }

    div.appendChild(div1);
    div1.appendChild(div2);
    div2.append(img, p);
    div1.appendChild(p1);
    div.appendChild(p2);
    if (p3) div.appendChild(p3);

    document.getElementById("message-container").appendChild(div).scrollIntoView({ behavior: "smooth" });
}

function updateOnline() {
    var online = JSON.parse(sessionStorage.getItem("online"));

    document.getElementById("online-count").innerText = online.length + " en ligne";

    var table = document.querySelector("#online-container > table");
    table.innerHTML = "";

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
        td.append(img, span);
        tr.appendChild(td);
        table.appendChild(tr);
        span.innerText = user;
    });
}

socket.on("profile.join", data => {
    var id = data.id;
    var username = data.username;

    pushMessage(id, "SYSTEM", `<b>${username}</b> a rejoint la session.`);

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    online.push(username);
    sessionStorage.setItem("online", JSON.stringify(online));
    updateOnline();
});

socket.on("profile.leave", data => {
    var id = data.id;
    var username = data.username;

    pushMessage(id, "SYSTEM", `<b>${username}</b> a quitté la session.`);

    var online = JSON.parse(sessionStorage.getItem("online") || "[]");
    online = online.splice(online.indexOf(username), 1);
    sessionStorage.setItem("online", JSON.stringify(online));
    updateOnline();
});

if (!sessionStorage.getItem("username") && getCookie("token")) {
    axios.get("/api/profile/@me").then(res => {
        sessionStorage.setItem("username", res.data.username);
        sessionStorage.setItem("id", res.data.id);
    }, () => {
        resetProfile();
        showError("Session terminée, veuillez vous reconnecter", () => {
            document.location.href = "/login";
        });
    });
}

function update() {
    axios.get("/api/profiles/online").then(res => {
        sessionStorage.setItem("online", JSON.stringify(res.data));

        updateOnline();
    }, err => {
        if (err.response?.status == 403) {
            resetProfile();
            showError(err.response?.data || "Erreur inattendue", () => {
                document.location.href = "/login";
            });
        }
    });
    setTimeout(update, 1000 * 60);
}
update();

document.getElementById("show-online").addEventListener("click", ev => {
    document.getElementById("show-online").parentElement.classList.toggle("active");
});

document.getElementById("send-message").addEventListener("submit", ev => {
    ev.preventDefault();

    var msg = document.getElementById("message").value;
    if (msg.trim().length == 0) return;

    var btn = document.getElementById("send-message").querySelector("input[type=submit]");
    btn.disabled = true;

    axios.put("/api/message", { message: msg.trim() }).then(() => {
        document.getElementById("message").value = "";
    }).catch(err => {
        if (err.response?.status == 403) {
            resetProfile();
            showError(err.response?.data || "Erreur inattendue", () => {
                document.location.href = "/login";
            });
            return;
        }
        showError(err.response?.data || "Erreur inattendue");
    }).finally(() => {
        btn.disabled = false;
    });
});

function disconnect() {
    this.disabled = true;
    axios.delete("/api/profile").then(res => {
        resetProfile();
        showSuccess("Déconnecté !", () => document.location.href = "/login");
    }, err => {
        showError(err);
        this.disabled = false;
    });
}