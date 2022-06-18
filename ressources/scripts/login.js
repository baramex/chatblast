if (localStorage.getItem("username") && localStorage.getItem("id")) attemptToRefreshProfile();

document.getElementById("login-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const username = document.getElementById("username").value.trim().toLowerCase();
    if (username.length == 0) return;
    if (!(/^[a-z]{1,32}$/).test(username)) return showError("Le nom d'utilisateur ne doit contenir que des lettres !");

    if (!localStorage.getItem("terms")) {
        return showInfo("Vous devez accepter les <a href='/terms' target='_blank'>conditions d'utilisations</a> pour continuer.", () => {
            localStorage.setItem("terms", true);
            document.getElementById("login-form").dispatchEvent(ev);
        });
    }

    api("/profile", "post", { username }, true).then(res => {
        localStorage.setItem("username", res.username.trim());
        localStorage.setItem("id", res.id);
        document.location.href = "/";
    });
});