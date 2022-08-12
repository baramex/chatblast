import React from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../../lib/service";
import { Footer } from "../Layout/Footer";
import ErrorPopup from "../Misc/ErrorPopup";

export default class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: ""
        };

        this.handleLogin = this.handleLogin.bind(this);

        document.title = "ChatBlast | connexion";
    }

    async handleLogin(event) {
        event.preventDefault();

        event.target.querySelectorAll("input").forEach(a => a.disabled = true);
        try {
            const username = event.target.username.value;
            const password = event.target.password.value;

            const response = await loginUser(username, password);

            sessionStorage.setItem("username", response.username);
            sessionStorage.setItem("id", response.id);

            this.props.navigation("/");
        } catch (error) {
            this.setState({ error });
            event.target.querySelectorAll("input").forEach(a => a.disabled = false);
        }
    }

    render() {
        return (
            <>
                {this.state.error && <ErrorPopup message={this.state.error} onClose={() => this.setState({ error: "" })}></ErrorPopup>}
                <form id="login-form" className="position-absolute top-50 start-50 translate-middle container" onSubmit={this.handleLogin} style={{ width: "35%" }}>
                    <div className="text-center mb-2">
                        <h1 className="mb-4 fw-normal form-label">Bienvenue sur <strong>ChatBlast</strong></h1>
                        <input type="text" className="form-control fs-4" id="username" placeholder="Nom d'utilisateur" name="username"
                            autoComplete="off" maxLength="32" required />
                        <input type="password" className="form-control fs-4 mt-4" id="password" placeholder="Mot de passe"
                            name="password" autoComplete="off" maxLength="32" required />
                    </div>
                    <Link to="/register">Vous n'avez pas de compte ?</Link>
                    <div className="text-center mt-4">
                        <input type="submit" name="submit" className="btn btn-outline-dark btn-lg fs-5 px-5" value="Continuer" />
                    </div>
                </form>
                <Footer />
            </>
        );
    }
}