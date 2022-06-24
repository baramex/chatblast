function resetProfile() {
    var terms = localStorage.getItem("terms");
    localStorage.clear();
    localStorage.setItem("terms", terms ? true : false);
    sessionStorage.clear();
    deleteCookie("token");
    deleteCookie("id");
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

function showConfirm(message, onconfirm) {
    openPopup("confirm", message, onconfirm);
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
    img.src = "/images/" + (type == "confirm" ? "warning" : type) + ".png";
    img.width = 150;

    var p = document.createElement("p");
    p.innerHTML = text;
    p.classList.add("text-dark", "fs-4");
    p.style.fontFamily = "sans-serif";
    popup.append(img, p);

    var hiddentab = document.createElement("div");
    hiddentab.id = "hidden-tab";
    hiddentab.style.width = "100vw";
    hiddentab.style.height = "100vh";
    hiddentab.style.backdropFilter = "blur(5px)";
    hiddentab.style.zIndex = "50";
    hiddentab.classList.add("position-fixed", "t-0", "s-0", "bg-dark", "bg-opacity-50");

    var tofoc = null;
    if (type != "confirm") {
        var button = document.createElement("button");
        button.classList.add("btn", type == "valid" ? "btn-success" : type == "error" ? "btn-danger" : "btn-info", "px-3", "py-2");
        button.innerText = "Ok";
        if (type == "info") button.style.color = "white";

        popup.append(button);
        tofoc = button;

        button.onclick = () => {
            if (action) action();
            closePopup();
        };
        hiddentab.onclick = button.onclick;
    }
    else {
        var buttonCancel = document.createElement("button");
        buttonCancel.classList.add("btn", "btn-danger", "px-3", "py-2", "mx-3");
        buttonCancel.innerText = "Annuler";

        var buttonOk = document.createElement("button");
        buttonOk.classList.add("btn", "btn-success", "px-3", "py-2", "mx-3");
        buttonOk.innerText = "Oui";

        popup.append(buttonCancel, buttonOk);
        tofoc = buttonCancel;

        buttonCancel.onclick = () => {
            closePopup();
        };
        hiddentab.onclick = buttonCancel.onclick;

        buttonOk.onclick = () => {
            action();
            closePopup();
        };
    }

    popup.animate([{ transform: "translate(-50%, -50%) scale(0)" }, { transform: "translate(-50%, -50%) scale(1)" }], { duration: 300, easing: "cubic-bezier(0.6, 0.2, 0.2, 1.2)" });
    document.body.appendChild(popup);
    tofoc.focus();

    hiddentab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    document.body.appendChild(hiddentab);
}

var pending_request = false;
function api(endpoint, method, data = undefined, isShowError = false, errorAction = undefined, successMessage = undefined, successAction = undefined) {
    return new Promise((res, rej) => {
        if (pending_request) return setTimeout(() => api(endpoint, method, data, isShowError, errorAction, successMessage, successAction).then(res).catch(rej), 10);

        // -> axios clear data
        var copyData = data ? { ...data } : undefined;

        pending_request = true;
        axios({
            method,
            url: "/api" + endpoint,
            data
        }).then(response => {
            if (successMessage) {
                showSuccess(successMessage, successAction);
            }
            res(response.data);
        }).catch(err => {
            var response = err.response;
            if (!response) return rej();
            var status = response.status;
            var time = err.response.headers["retry-after"];
            if (status == 429 && time && time * 1000 < 10000) {
                setTimeout(() => {
                    api(endpoint, method, copyData, isShowError, errorAction, successMessage, successAction).then(res).catch(rej);
                }, time * 1000);
            }
            else if (status == 401) {
                attemptToRefreshProfile().then(() => {
                    api(endpoint, method, copyData, isShowError, errorAction, successMessage, successAction).then(res).catch(rej);
                }).catch(err_ => {
                    document.location.href = "/login";
                    rej(err_);
                });
            }
            else {
                var message = response.data;
                if (isShowError) {
                    showError(message, errorAction);
                }
                rej(message);
            }
        }).finally(() => {
            pending_request = false;
        });
    });
}