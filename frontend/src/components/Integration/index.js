import { useEffect, useState } from "react";
import { isLoggedIntegration } from "../../lib/service/authentification";
import { fetchIntegration, oauthProfile } from "../../lib/service/integration";
import Home from "../Home";
import ConfirmPopup from "../Misc/ConfirmPopup";
import ErrorPopup from "../Misc/ErrorPopup";
import Loading from "../Misc/Loading";

export default function Integration() {
    const [id] = useState(window.location.pathname.split("/").pop());
    const [integration, setIntegration] = useState(null);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [requestTerms, setRequestTerms] = useState(undefined);
    const [logged, setLogged] = useState(-1);

    useEffect(() => {
        getIntegration(id, setIntegration, setError);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (integration) isLoggedIntegration(integration).then(setLogged);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [integration]);

    useEffect(() => {
        const callback = (message) => {
            const data = message.data;
            if (data?.name === "token") {
                console.log("message received");
                setToken(data.value);
            }
        }

        window.addEventListener("message", callback);
        console.log("send message");
        window.parent.postMessage("chatblast:token", "*");

        return () => {
            window.removeEventListener("message", callback);
        }
    }, []);

    useEffect(() => {
        if (integration && !error && logged !== -1 && !logged && !requestTerms) {
            if (!localStorage.getItem("terms")) setRequestTerms(true);
            else {
                if (!token) setError("Connectez-vous au site pour accéder à cette page.");
                else {
                    oauthProfile_(id, token, setError, setLogged);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [integration, token, requestTerms, logged]);

    return (<>
        {
            error ?
                <ErrorPopup message={error} onClose={() => { }} />
                : requestTerms ?
                    <ConfirmPopup title="Conditions d'utilisation" show={requestTerms} message={"Pour continuer, il vous faut accepter les conditions d'utilisation"} onConfirm={() => { localStorage.setItem("terms", true); setRequestTerms(false); }} onClose={() => setRequestTerms(false)} />
                    : integration && logged === true ?
                        <Home integrationId={id} logged={true} />
                        : <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><Loading color="text-white" width="w-14" height="h-14" /></div>
        }
    </>);
}

async function getIntegration(id, setIntegration, setError) {
    try {
        const integration = await fetchIntegration(id);
        setIntegration(integration);
    } catch (error) {
        setError(error.message || error);
    }
}

async function oauthProfile_(id, token, setError, setLogged) {
    try {
        const profile = await oauthProfile(id, token);

        sessionStorage.setItem("id", profile.id);
        sessionStorage.setItem("username", profile.username);
        sessionStorage.setItem("type", profile.type);

        setLogged(true);
    } catch (error) {
        setError(error.message || error);
    }
}