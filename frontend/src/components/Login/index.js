import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLogged, loginUser } from "../../lib/service/authentification";
import Footer from "../Layout/Footer";
import ConfirmPopup from "../Misc/ConfirmPopup";
import ErrorPopup from "../Misc/ErrorPopup";

export default function Login() {
    const [error, setError] = React.useState(undefined);
    const [requestTerms, setRequestTerms] = React.useState(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        if (isLogged()) navigate(new URLSearchParams(window.location.search).get("to") || "/");
        document.title = "ChatBlast | connexion";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLogged()) return null;

    return (<>
        <ConfirmPopup title="Conditions d'utilisation" show={!!requestTerms} message={"Pour continuer, il vous faut accepter les conditions d'utilisation"} onConfirm={() => { localStorage.setItem("terms", true); setRequestTerms(false); requestTerms.callback(); }} onClose={() => setRequestTerms(false)} />
        <ErrorPopup title="Erreur de connexion" message={error} onClose={() => setError("")} />

        <div className="flex items-center h-[100vh] justify-between flex-col gap-10">
            <div className="invisible"></div>
            <div className="lg:w-[35%] md:w-3/4 sm:w-4/5">
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
                <form className="mt-6" onSubmit={e => handleLogin(e, setError, setRequestTerms, navigate)}>
                    <div className="mb-2">
                        <div className="-space-y-px rounded-md text-lg">
                            <div>
                                <label htmlFor="username" className="sr-only">
                                    Nom d'utilisateur
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
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
                                    autoComplete="current-password"
                                    required
                                    className="relative block w-full appearance-none rounded-none rounded-b-md border border-emerald-600 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-emerald-900 focus:outline-none"
                                    placeholder="Mot de passe"
                                    maxLength="32"
                                />
                            </div>
                        </div>
                    </div>
                    <Link className="text-gray-900 hover:underline underline-offset-2" to={"/register" + window.location.search}>Vous n'avez pas de compte ?</Link>
                    <div className="text-center mt-4">
                        <input type="submit" name="submit" className="transition-colors cursor-pointer mt-3 rounded-md border border-transparent bg-emerald-700 py-2 px-10 text-md font-medium text-white hover:bg-emerald-800 focus:outline-none" value="Continuer" />
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    </>);
}

async function handleLogin(event, setError, setRequestTerms, navigate) {
    event.preventDefault();

    if (!localStorage.getItem("terms")) {
        return setRequestTerms({ callback: () => handleLogin(event, setError, setRequestTerms, navigate) });
    }

    event.target.querySelectorAll("input").forEach(a => a.disabled = true);
    try {
        const username = event.target.username.value;
        const password = event.target.password.value;

        const response = await loginUser(username, password);

        sessionStorage.setItem("username", response.username);
        sessionStorage.setItem("id", response.id);
        sessionStorage.setItem("type", response.type);

        navigate(new URLSearchParams(window.location.search).get("to") || "/");
    } catch (error) {
        setError(error.message || error);
        event.target.querySelectorAll("input").forEach(a => a.disabled = false);
    }
}