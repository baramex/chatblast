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
        }).then(res => console.log(res.data)).catch(console.error);
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
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const password_ = document.getElementById("password_").value
    const usernameRegex = /^[a-z]{1,32}$/;
    const passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;
    try {
        if (!usernameRegex.test(username)) throw new Error("Votre nom d'utilisateur est incorrect. Il ne doit pas contenir de majuscules !");
        if (!passwordRegex.test(password)) throw new Error("Votre mot de passe est incorrect ! ")
        if (password != password_) throw new Error("Vos mots de passes doivent être identiques !");
        await axios.post("/api/profile", { username, password }).then(() => {
            avatarInput.files[0] ? new UploadImage(avatarInput.files[0]).upload() : "";
            showSuccess("Compte créé ! Vous allez être redirigé(e)", () => document.location.href = "/");
        }).catch((err) => {
            console.log(err)
            throw new Error(err.response.data);
        });

    } catch (err) {
        button.removeAttribute("disabled");
        showError(err.message)
    }
});

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = e => document.getElementById("avatar-img").src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}