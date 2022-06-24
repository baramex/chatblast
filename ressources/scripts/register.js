class UploadImage {
    constructor(file) {
        this.file = file;
    }

    upload() {
        const formData = new FormData();

        formData.append('avatar', this.file);
        return axios.put("/api/profile/@me/avatar/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    }
}

const button = document.querySelector("input[type=submit]");
const avatarInput = document.getElementById("avatar-input");

avatarInput.addEventListener('input', () => {
    document.getElementById("avatar-container").querySelector("p").hidden = true;
    document.getElementById("add-picture").hidden = true;
    document.getElementById("avatar-img").style.width = "100%";
    document.getElementById("avatar-img").style.height = "100%";
    readURL(avatarInput);
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    button.setAttribute("disabled", true);
    const username = document.getElementById("username").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();
    const password_ = document.getElementById("password_").value.trim();
    const usernameRegex = /^[a-z]{1,32}$/;
    const passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;
    try {
        if (!usernameRegex.test(username)) throw new Error("Votre nom d'utilisateur ne doit pas excéder 32 caractères alphabétiques.");
        if (!passwordRegex.test(password)) throw new Error("Votre mot de passe n'est pas conforme aux règles (une lettre majuscule, une lettre minuscule ou un chiffre et au moins 6 caractères).");
        if (password != password_) throw new Error("Vos mots de passes doivent être identiques !");
        await api("/profile", "post", { username, password }).then(res => {
            sessionStorage.setItem("username", res.username);
            sessionStorage.setItem("id", res.id);
        });

        if (avatarInput.files[0]) new UploadImage(avatarInput.files[0]).upload().catch(() => { }).then(() => {
            showSuccess("Compte créé ! Vous allez être redirigé", () => document.location.href = "/");
        });
        else showSuccess("Compte créé ! Vous allez être redirigé", () => document.location.href = "/");
    } catch (err) {
        showError(err.message || err);
        button.removeAttribute("disabled");
    }
});

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = e => document.getElementById("avatar-img").src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}