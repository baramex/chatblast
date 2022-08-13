import { Component } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../../lib/hooks/authentification";
import { Footer } from "../Layout/Footer";
import ErrorPopup from "../Misc/ErrorPopup";

export default class Register extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            avatar: null
        }

        this.handleRegister = this.handleRegister.bind(this);
        this.handleAvatar = this.handleAvatar.bind(this);

        document.title = "ChatBlast | inscription";
    }

    async handleRegister(event) {
        event.preventDefault();

        event.target.querySelectorAll("input").forEach(a => a.disabled = true);
        try {
            const username = event.target.username.value.trim().toLowerCase();
            const password = event.target.password.value.trim();
            const password_ = event.target.password_.value.trim();
            const avatar = event.target.avatar.files[0];

            const usernameRegex = /^[a-z]{1,32}$/;
            const passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;

            if (!usernameRegex.test(username)) throw new Error("Nom d'utilisateur invalide, il ne doit contenir que des lettres");
            if (password !== password_) throw new Error("Les mots de passe ne correspondent pas.");
            if (!passwordRegex.test(password)) throw new Error("Mot de passe non conforme.")

            const user = await registerUser(username, password, avatar);

            sessionStorage.setItem("username", user.username);
            sessionStorage.setItem("id", user.id);

            this.props.navigation("/");
        } catch (error) {
            this.setState({ error });
            event.target.querySelectorAll("input").forEach(a => a.disabled = false);
        }
    }

    handleAvatar(event) {
        if (event.target.files && event.target.files[0]) {
            if (event.target.files[0].size >= 500_000) {
                event.preventDefault();
                return this.setState({ error: "Votre photo de profil est trop lourde." });
            }
            this.setState({ avatar: URL.createObjectURL(event.target.files[0]) });
        }
    }

    render() {
        return (<>
            {this.state.error && <ErrorPopup message={this.state.error} onClose={() => this.setState({ error: "" })}></ErrorPopup>}
            <form id="register-form" className="position-absolute top-50 start-50 translate-middle container"
                style={{ width: "40%", maxWidth: 800 }} onSubmit={this.handleRegister}>
                <div className="text-center">
                    <h1 className="mb-4 fw-normal form-label">Bienvenue sur <strong>ChatBlast</strong></h1>
                    <div className="d-flex direction-column mt-4 justify-content-evenly w-100 inputs-container">
                        <label htmlFor="avatar-input"
                            className="rounded-circle me-5 mt-4 pointer position-relative d-flex justify-content-center align-items-center p-1"
                            style={{ width: 150, height: 150 }} id="avatar-container">
                            <p className="fs-5 m-0" style={{ color: "#ececec" }} hidden={this.state.avatar ? true : false}>Photo de <br />profil</p>
                            <input type="file" accept="image/*" name="avatar" id="avatar-input" onInput={this.handleAvatar} />
                            <img className="rounded-circle w-100 h-100" src={this.state.avatar} alt="avatar" hidden={this.state.avatar ? false : true} />
                            <img className="position-absolute top-0 end-0 me-2 mt-1" width="25%" src="/images/add-picture.png" alt="add-avatar" hidden={this.state.avatar ? true : false} />
                        </label>
                        <div className="flex-grow-1 text-start">
                            <input type="text" className="form-control fs-4" id="username" placeholder="Nom d'utilisateur"
                                name="username" autoComplete="off" maxLength="32" required />
                            <input type="password" className="form-control fs-4 mt-4" id="password" placeholder="Mot de passe"
                                name="password" autoComplete="off" maxLength="32" required />
                            <input type="password" className="form-control fs-4 mt-4 mb-2" id="password_"
                                placeholder="Confirmez votre mot de passe" autoComplete="off" maxLength="32" required />
                            <Link to="/login" className="fs-6 align-top">Vous avez déjà un compte ?</Link>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <input type="submit" className="btn btn-outline-dark btn-lg fs-5 px-5" value="S'inscrire" />
                </div>
            </form>
            <Footer />
        </>)
    }
}