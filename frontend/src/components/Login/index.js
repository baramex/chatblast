import React from "react";
import { Footer } from "../Layout/Footer";

export default class Login extends React.Component {
    render() {
        return (
            <>
                <form id="login-form" className="position-absolute top-50 start-50 translate-middle container" style={{ width: "35%" }}>
                    <div className="text-center mb-2">
                        <h1 className="mb-4 fw-normal form-label">Bienvenue sur <strong>ChatBlast</strong></h1>
                        <input type="text" className="form-control fs-4" id="username" placeholder="Nom d'utilisateur" name="username"
                            autocomplete="off" maxlength="32" required />
                        <input type="password" className="form-control fs-4 mt-4" id="password" placeholder="Mot de passe"
                            name="password" autocomplete="off" maxlength="32" required />
                    </div>
                    <a href="/register">Vous n'avez pas de compte ?</a>
                    <div className="text-center mt-4">
                        <input type="submit" className="btn btn-outline-dark btn-lg fs-5 px-5" value="Continuer" />
                    </div>
                </form>
                <Footer />
            </>
        );
    }
}