import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLogged, loginUser } from "../../lib/service/authentification";
import Footer from "../Layout/Footer";
import ErrorPopup from "../Misc/ErrorPopup";

export default function Login() {
    const [error, setError] = React.useState(undefined);
    const navigate = useNavigate();


    useEffect(() => {
        if (isLogged()) navigate("/");
        document.title = "ChatBlast | connexion";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if(isLogged()) return null;
    return (<>
        {error && <ErrorPopup message={error} onClose={() => setError("")}></ErrorPopup>}
        <form id="login-form" className="position-absolute top-50 start-50 translate-middle container" onSubmit={e => handleLogin(e, setError, navigate)} style={{ width: "35%" }}>
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
    </>);
}

async function handleLogin(event, setError, navigate) {
    event.preventDefault();

    event.target.querySelectorAll("input").forEach(a => a.disabled = true);
    try {
        const username = event.target.username.value;
        const password = event.target.password.value;

        const response = await loginUser(username, password);

        sessionStorage.setItem("chatblast-username", response.username);
        sessionStorage.setItem("chatblast-id", response.id);

        navigate("/");
    } catch (error) {
        setError(error.message || error);
        event.target.querySelectorAll("input").forEach(a => a.disabled = false);
    }
}