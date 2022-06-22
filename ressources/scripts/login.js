document.getElementById("login-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    axios.post("/api/login", { username, password }).then(res => {
        console.log(res.data);
        sessionStorage.setItem("username", res.data.username.trim());
        document.location.href = "/";
    }).catch(err => console.log(err, err.response.data));
    

    if (!localStorage.getItem("terms")) {
        return showInfo("Vous devez accepter les <a href='/terms' target='_blank'>conditions d'utilisations</a> pour continuer.", () => {
            localStorage.setItem("terms", true);
            document.getElementById("login-form").dispatchEvent(ev);
        });
    }
});