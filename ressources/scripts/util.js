function resetProfile() {
    sessionStorage.clear();
    deleteCookie("token");
}

function deleteCookie(name) {
    let expires = "expires=" + new Date(0).toUTCString();
    document.cookie = name + "=;" + expires;
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function showError(error, action = null) {
    openPopup("error", error, action);
}

function showSuccess(message, action = null) {
    openPopup("valid", message, action);
}

function showInfo(message, action = null) {
    openPopup("info", message, action);
}

function closePopup(hidden = true) {
    var popup = document.getElementById("popup");
    if (!popup) return;
    popup.animate([{ transform: "translate(-50%, -50%) scale(1)" }, { transform: "translate(-50%, -50%) scale(0)" }], { duration: 300, easing: "cubic-bezier(0.6, 0.2, 0.2, 1.2)" }).onfinish = () => popup.remove();

    if (hidden) {
        var hiddentab = document.getElementById("hidden-tab");
        hiddentab.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => hiddentab.remove();
    }
}

function openPopup(type, text, action = null) {
    if (document.getElementById("popup") || document.getElementById("hidden-tab")) {
        document.getElementById("popup")?.remove();
        document.getElementById("hidden-tab")?.remove();
    }

    var popup = document.createElement("div");
    popup.id = "popup";
    popup.setAttribute("role", "alert");
    popup.style.minWidth = "400px";
    popup.style.maxWidth = "700px";
    popup.style.zIndex = "70";
    popup.classList.add("popup", "popup-status", "text-center", "px-5", "py-4", "bg-light", "top-50", "start-50", "position-absolute", "translate-middle", "rounded-3");

    var img = document.createElement("img");
    img.src = "/images/" + type + ".png";
    img.width = 150;

    var p = document.createElement("p");
    p.innerHTML = text;
    p.classList.add("text-dark", "fs-4");
    p.style.fontFamily = "sans-serif";

    var button = document.createElement("button");
    button.classList.add("btn", type == "valid" ? "btn-success" : type == "error" ? "btn-danger" : "btn-info", "px-3", "py-2");
    button.innerText = "Ok";
    if (type == "info") button.style.color = "white";

    popup.append(img, p, button);
    popup.animate([{ transform: "translate(-50%, -50%) scale(0)" }, { transform: "translate(-50%, -50%) scale(1)" }], { duration: 300, easing: "cubic-bezier(0.6, 0.2, 0.2, 1.2)" });
    document.body.appendChild(popup);
    button.focus();

    var hiddentab = document.createElement("div");
    hiddentab.id = "hidden-tab";
    hiddentab.style.width = "100vw";
    hiddentab.style.height = "100vh";
    hiddentab.style.backdropFilter = "blur(5px)";
    hiddentab.style.zIndex = "50";
    hiddentab.classList.add("position-fixed", "t-0", "s-0", "bg-dark", "bg-opacity-50");

    hiddentab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    document.body.appendChild(hiddentab);

    button.onclick = () => {
        if (action) action();
        closePopup();
    };

    hiddentab.onclick = button.onclick;
}