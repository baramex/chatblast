if (localStorage.getItem("username") && localStorage.getItem("id")) attemptToRefreshProfile();

const form = document.getElementById("login-form");
form.addEventListener("submit", ev => {
    ev.preventDefault();
    const username = document.getElementById("username").value.trim().toLowerCase();
    if (username.length == 0) return;
    if (!(/^[a-z]{1,32}$/).test(username)) return showError("Le nom d'utilisateur ne doit contenir que des lettres !");

    form.querySelectorAll("input").forEach(a => a.disabled = true);

    if (!localStorage.getItem("terms")) {
        return showInfo("Vous devez accepter les <a href='/terms' target='_blank'>conditions d'utilisations</a> pour continuer.", () => {
            localStorage.setItem("terms", true);
            form.dispatchEvent(ev);
        });
    }

    api("/profile", "post", { username }, true).then(res => {
        localStorage.setItem("username", res.username.trim());
        localStorage.setItem("id", res.id);
        sessionStorage.setItem("unread", res.unread);
        document.location.href = "/";
    }).catch(() => {
        form.querySelectorAll("input").forEach(a => a.disabled = false);
    });
});