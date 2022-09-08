import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLogged, registerUser } from "../../lib/service/authentification";
import Footer from "../Layout/Footer";
import ConfirmPopup from "../Misc/ConfirmPopup";
import ErrorPopup from "../Misc/ErrorPopup";

export default function Register() {
    const [error, setError] = React.useState(undefined);
    const [avatar, setAvatar] = React.useState(undefined);
    const [requestTerms, setRequestTerms] = React.useState(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLogged()) navigate(window.location.pathname + "/../");
        document.title = "ChatBlast | inscription";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLogged()) return null;
    return (<>
        {requestTerms && <ConfirmPopup type="terms" onConfirm={() => { localStorage.setItem("terms", true); setRequestTerms(false); requestTerms.callback(); }} onClose={() => setRequestTerms(false)} />}
        {error && <ErrorPopup message={error} onClose={() => setError("")}></ErrorPopup>}
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh", marginBottom: 60 }}>
            <form id="register-form"
                style={{ maxWidth: 800, minWidth: "40%" }} onSubmit={e => handleRegister(e, setError, setRequestTerms, navigate)}>
                <div className="text-center">
                    <h1 className="mb-4 fw-normal form-label">Bienvenue sur <strong>ChatBlast</strong></h1>
                    <div className="d-flex direction-column mt-4 justify-content-evenly w-100 inputs-container">
                        <label htmlFor="avatar-input"
                            className="rounded-circle me-5 mt-4 pointer position-relative d-flex justify-content-center align-items-center p-1"
                            style={{ width: 150, height: 150 }} id="avatar-container">
                            <p className="fs-5 m-0" style={{ color: "#ececec" }} hidden={avatar ? true : false}>Photo de <br />profil</p>
                            <input type="file" accept="image/*" name="avatar" id="avatar-input" onInput={e => handleAvatar(e, setAvatar, setError)} />
                            <img className="rounded-circle w-100 h-100" src={avatar} alt="avatar" hidden={avatar ? false : true} />
                            <img className="position-absolute top-0 end-0 me-2 mt-1" width="25%" src="/images/add-picture.png" alt="add-avatar" hidden={avatar ? true : false} />
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
        </div>
        <Footer />
    </>);
}

function handleAvatar(event, setAvatar, setError) {
    if (event.target.files && event.target.files[0]) {
        if (event.target.files[0].size >= 500_000) {
            event.preventDefault();
            return setError("Votre photo de profil est trop lourde.");
        }
        setAvatar(URL.createObjectURL(event.target.files[0]));
    }
}

async function handleRegister(event, setError, setRequestTerms, navigate) {
    event.preventDefault();

    if (!localStorage.getItem("terms")) {
        return setRequestTerms({ callback: () => handleRegister(event, setError, setRequestTerms, navigate) });
    }

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

        sessionStorage.setItem("chatblast-username", user.username);
        sessionStorage.setItem("chatblast-id", user.id);
        sessionStorage.setItem("chatblast-anonyme", user.anonyme || false);

        navigate(window.location.pathname + "/../");
    } catch (error) {
        setError(error.message || error);
        event.target.querySelectorAll("input").forEach(a => a.disabled = false);
    }
}