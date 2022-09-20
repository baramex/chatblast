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
        if (isLogged()) navigate(new URLSearchParams(window.location.search).get("to") || "/");
        document.title = "ChatBlast | inscription";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLogged()) return null;

    return (<>
        <ConfirmPopup title="Conditions d'utilisation" show={!!requestTerms} message={"Pour continuer, il vous faut accepter les conditions d'utilisation"} onConfirm={() => { localStorage.setItem("terms", true); setRequestTerms(false); requestTerms.callback(); }} onClose={() => setRequestTerms(false)} />
        <ErrorPopup title="Erreur d'inscription" message={error} onClose={() => setError("")} />

        <div className="flex items-center h-[100vh] justify-between flex-col gap-10">
            <div className="invisible"></div>
            <div className="max-w-4xl lg:w-[40%] md:w-3/4 sm:w-4/5">
                <div className="text-center">
                    <img
                        className="inline h-16"
                        src="/images/logo-white.png"
                        alt="chatblast"
                    />
                    <h1 className="inline text-3xl font-bold tracking-tight text-gray-900 font-normal ml-2 align-sub">
                        Bienvenue sur <strong>ChatBlast</strong>
                    </h1>
                </div>
                <form onSubmit={e => handleRegister(e, setError, setRequestTerms, navigate)}>
                    <div className="text-center">
                        <div className="flex mt-4 gap-10 items-center sm:items-start w-full flex-col sm:flex-row">
                            <label htmlFor="avatar-input"
                                className="rounded-full cursor-pointer relative flex justify-center items-center p-1 w-36 h-36 bg-emerald-700 border-emerald-900 border-2 border-dashed" id="avatar-container">
                                <p className="text-lg text-white m-0" hidden={avatar ? true : false}>Photo de <br />profil</p>
                                <input type="file" accept=".png,.jpg,.jpeg" name="avatar" id="avatar-input" onInput={e => handleAvatar(e, setAvatar, setError)} hidden />
                                <img className={"rounded-full w-full h-full object-cover" + (avatar ? "" : " hidden")} src={avatar} alt="avatar" />
                                <img className="absolute top-0 right-0 ml-2 mt-1" width="25%" src="/images/add-picture.png" alt="add-avatar" hidden={avatar ? true : false} />
                            </label>
                            <div className="grow w-full sm:w-auto text-left -space-y-px">
                                <div>
                                    <label htmlFor="username" className="sr-only">
                                        Nom d'utilisateur
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="off"
                                        className="mb-2 relative block w-full appearance-none rounded-none rounded-t-md border border-emerald-600 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-emerald-900 focus:outline-none"
                                        placeholder="Nom d'utilisateur"
                                        maxLength="32"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="sr-only">
                                        Mot de passe
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="off"
                                        required
                                        className="mb-2 relative block w-full appearance-none border border-emerald-600 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-emerald-900 focus:outline-none"
                                        placeholder="Mot de passe"
                                        minLength="6"
                                        maxLength="32"
                                    />
                                </div>
                                <div className="mb-2">
                                    <label htmlFor="password" className="sr-only">
                                        Confirmer le mot de passe
                                    </label>
                                    <input
                                        id="password_"
                                        name="password_"
                                        type="password"
                                        autoComplete="off"
                                        required
                                        className="relative block w-full appearance-none rounded-none rounded-b-md border border-emerald-600 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-emerald-900 focus:outline-none"
                                        placeholder="Confirmer le mot de passe"
                                        minLength="6"
                                        maxLength="32"
                                    />
                                </div>
                                <Link className="text-gray-900 hover:underline underline-offset-2" to={"/login" + window.location.search}>Vous avez déjà un compte ?</Link>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <input type="submit" className="transition-colors cursor-pointer mt-3 rounded-md border border-transparent bg-emerald-700 py-2 px-10 text-md font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" value="S'inscrire" />
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    </>);
}

function handleAvatar(event, setAvatar, setError) {
    if (event.target.files && event.target.files[0]) {
        if (event.target.files[0].size >= 500_000) {
            event.preventDefault();
            return setError("Votre photo de profil est trop lourde, 500 Mo max.");
        }
        if (event.target.files.length > 1 || !["png", "jpeg", "jpg"].map(a => "image/" + a).includes(event.target.files[0].type)) {
            event.preventDefault();
            return setError("L'image doit être au format PNG, JPEG ou JPG.");
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

        const usernameRegex = /^[a-z0-9]{1,32}$/;
        const passwordRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,32}$)/;

        if (!usernameRegex.test(username)) throw new Error("Nom d'utilisateur invalide, il ne peut contenir que des lettres minuscules et des chiffres.");
        if (password !== password_) throw new Error("Les mots de passe ne correspondent pas.");
        if (!passwordRegex.test(password)) throw new Error("Mot de passe non conforme, il doit contenir au moins deux des caractères: chiffre, lettre minuscule, lettre majuscule.")

        const user = await registerUser(username, password, avatar);

        sessionStorage.setItem("username", user.username);
        sessionStorage.setItem("id", user.id);
        sessionStorage.setItem("type", user.type);

        navigate(new URLSearchParams(window.location.search).get("to") || "/");
    } catch (error) {
        setError(error.message || error);
        event.target.querySelectorAll("input").forEach(a => a.disabled = false);
    }
}