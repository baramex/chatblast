import { useEffect, useState } from "react";
import { isLogged } from "../../lib/service/authentification";
import { fetchIntegration, oauthProfile } from "../../lib/service/integration";
import Home from "../Home";
import ErrorPopup from "../Misc/ErrorPopup";
import Loading from "../Misc/Loading";

const INTEGRATIONS_TYPE = {
    CUSTOM_AUTH: 0,
    ANONYMOUS_AUTH: 1,
};

export default function Integration() {
    const [id] = useState(window.location.pathname.split("/").pop());
    const [integration, setIntegration] = useState(null);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        getIntegration(id, setIntegration, setError);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const callback = (message) => {
            const data = message.data;
            if (data?.name === "token") {
                setToken(data.value);
            }
        }

        window.addEventListener("message", callback);
        window.parent.postMessage("chatblast:token", "*");

        return () => {
            window.removeEventListener("message", callback);
        }
    }, []);

    useEffect(() => {
        if (integration && !error && !isLogged(id)) {
            if (integration.type === INTEGRATIONS_TYPE.CUSTOM_AUTH) {
                if (!token) setError("Connectez-vous au site pour accéder à cette page.");
                else {
                    oauthProfile_(id, token, setError, setUpdate);
                }
            }
            else {

            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [integration, token]);

    return (<>
        {
            error ? <ErrorPopup message={error} canClose={false} /> : integration && isLogged(id) ? <Home integration={id} /> : <div className="position-absolute top-50 start-50 translate-middle"><Loading color="text-white" size="lg" /></div>
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

async function oauthProfile_(id, token, setError, setUpdate) {
    try {
        const profile = await oauthProfile(id, token);

        sessionStorage.setItem("chatblast-id", profile.id);
        sessionStorage.setItem("chatblast-username", profile.username);
        setUpdate(true);
    } catch (error) {
        setError(error.message || error);
    }
}