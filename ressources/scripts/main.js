const socket = io();

socket.on("message.send", data => {
    if (document.getElementById("nomes")) document.getElementById("nomes").remove();

    var author = data.author.username;
    var message = data.message;

    var div = document.createElement("div");
    div.classList.add("pb-2", "my-4", "rounded-3", "border", "border-secondary");

    var div1 = document.createElement("div");
    div1.classList.add("d-flex", "justify-content-between");

    var div2 = document.createElement("div");
    div2.classList.add("d-flex", "align-items-center", "border-dashed");
    div2.style.borderBottomRightRadius = "var(--bs-border-radius-lg)";

    var img = document.createElement("img");
    img.classList.add("mx-2");
    img.width = 30;
    img.src = "/images/user.png";
    img.alt = "avatar";

    var p = document.createElement("p");
    p.classList.add("pe-3", "ps-1", "py-1", "fs-5", "m-auto");
    p.innerText = author;

    var p1 = document.createElement("p");
    p1.style.float = "right";
    p1.classList.add("mt-2", "me-3");
    p1.innerText = new Date().toLocaleString("fr").replace(",", "");

    var p2 = document.createElement("p");
    p2.classList.add("my-4", "mx-4", "fs-5");
    p2.innerText = message;

    div.appendChild(div1);
    div1.appendChild(div2);
    div2.append(img, p);
    div1.appendChild(p1);
    div.appendChild(p2);

    document.getElementById("message-container").appendChild(div);
    div.scrollIntoView({ behavior: "smooth" });
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
        document.getElementById("online").innerText = "En ligne: " + res.data.count;
    }, console.error);
    setTimeout(update, 1000 * 60);
}
update();

document.getElementById("send-message").addEventListener("submit", ev => {
    ev.preventDefault();

    var msg = document.getElementById("message").value;
    if (msg.trim().length == 0) return;

    var btn = document.getElementById("send-message").querySelector("input[type=submit]");
    btn.disabled = true;

    axios.put("/api/message", { message: msg.trim() }).then(() => {
        document.getElementById("message").value = "";
    }).catch(err => {
        showError(err?.response?.data || "Erreur inattendue");
    }).finally(() => {
        btn.disabled = false;
    });
});