class UploadImage {
    constructor(file) {
        this.file = file;
    }

    upload() {
        const formData = new FormData();

        formData.append('avatar', this.file);
        return axios.post("/api/user/avatar", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }).then(res => console.log(res.data)).catch(err => console.log(err.response.data));
    }
}

const button = document.querySelector("input[type=submit]");

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    button.setAttribute("disabled", true);
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const password_ = document.getElementById("password_").value
    const usernameRegex = /^[a-z]{1,32}$/;
    const passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;
    try {
        if (!usernameRegex.test(username)) throw new Error("Votre nom d'utilisateur est incorrect");
        if (!passwordRegex.test(password)) throw new Error("Votre mot de passe est incorrect")
        if (password != password_) throw new Error("Vos mots de passes doivent être identiques !");
        
        await axios.post("/api/profile", { username, password }).then(() => showSuccess("Compte créé ! Vous allez être redirigé(e)", () => document.location.href = "/"));

    } catch (err) {
        button.setAttribute("disabled", false);
        // console.log(err);
    }
});

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = e => {
            $('#pp-img')
                .attr('src', e.target.result)
        };
        reader.readAsDataURL(input.files[0]);
    }
}