const form = document.getElementById("login-form");
form.addEventListener("submit", ev => {
    ev.preventDefault();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (!localStorage.getItem("terms")) {
        return showInfo("Vous devez accepter les <a href='/terms' target='_blank'>conditions d'utilisations</a> pour continuer.", () => {
            localStorage.setItem("terms", true);
            form.dispatchEvent(ev);
        });
    }

    form.querySelectorAll("input").forEach(a => a.disabled = true);

    api("/login", "post", { username, password }, true).then(res => {
        sessionStorage.setItem("username", res.username);
        sessionStorage.setItem("id", res.id);
        document.location.href = "/";
    }).catch(() => {
        form.querySelectorAll("input").forEach(a => a.disabled = false);
    });
});