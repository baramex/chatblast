import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, resetSession, USERS_TYPE } from "../../lib/service/authentification";
import { fetchMemberMessagesCount } from "../../lib/service/message";
import { fetchProfile } from "../../lib/service/profile";
import { formatDuration } from "../../lib/utils/date";
import HiddenTab from "./HiddenTab";
import Loading from "./Loading";

export default function ProfileViewer({ profileId, integrationId, onClose, onlines }) {
    const [messages, setMessages] = useState(undefined);
    const [profile, setProfile] = useState(undefined);
    const [closing, setClosing] = useState(false);
    const [closed, setClosed] = useState(false);
    const navigate = useNavigate();

    useState(() => {
        getProfile(profileId, setProfile);
        getMemberMessagesCount(profileId, setMessages);
    }, []);

    const isMe = profileId === sessionStorage.getItem("id");
    const online = onlines?.find(a => a.id === profileId);

    if (closed) return null;

    return (<>
        <HiddenTab />
        <div className={"d-flex position-absolute top-50 start-50 flex-column popup container " + (closing ? "popup-closing" : "popup-coming")} style={{ height: "75%", width: "40%", zIndex: 70 }} onAnimationEnd={!closing ? (e) => e.target.classList.remove("popup-coming") : e => { e.target.hidden = true; setClosed(true); onClose(); }}>
            <div className="rounded-4 rounded-bottom-0 w-100" style={{ height: "30%", backgroundColor: "#2DBF8F" }}>
                <button onClick={() => setClosing(true)} className="border-0 bg-transparent m-2" style={{ transform: "rotate(180deg)" }}><img width="35" src="/images/arrow.png" alt="return" /></button>
                {profile && <>
                    <div className="position-absolute start-50 translate-middle-x mt-3 text-center" style={{ zIndex: 5 }}>
                        <div className="rounded-circle p-2" style={{ backgroundColor: "#138F63", width: "120px", height: "120px" }}>
                            <button className={"border-0 w-100 h-100 p-0 position-relative overflow-hidden bg-transparent rounded-circle" + ((isMe && profile.type === USERS_TYPE.DEFAULT) ? " profile-avatar-change" : " cursor-default")}>
                                <img src={"/profile/" + profile.id + "/avatar"} className="object-fit-cover w-100 h-100" style={{ aspectRatio: "1/1" }} alt="avatar" />
                                {(isMe && profile.type === USERS_TYPE.DEFAULT) ? <div style={{ backgroundColor: "rgba(30, 30, 30, .7)", transform: "translate(-50%, 100%)", transition: "transform .3s ease-in-out" }} className="position-absolute bottom-0 start-50 w-100 py-1 pb-2 d-flex align-items-center justify-content-center">
                                    <img style={{ opacity: ".8" }} src="/images/camera.png" height="20" alt="camera" />
                                </div> : null}
                            </button>
                        </div>
                        <div>
                            <p className="fs-2 fw-bold d-inline me-2">{profile.username}</p>{(isMe && profile.type === USERS_TYPE.DEFAULT) ? <button className="bg-transparent border-0 align-text-bottom"><img className="align-text-bottom" src="/images/edit.png" width="20" alt="edit" /></button> : null}
                        </div>
                    </div>
                </>}
            </div>
            <div className="flex-grow-1 rounded-4 rounded-top-0 w-100 d-flex align-items-center position-relative" style={{ backgroundColor: "#D7F5EA" }}>
                {!profile ? <div className="position-absolute start-50 top-50 translate-middle"><Loading size="lg" /></div> : <>
                    <div className="d-flex w-100 text-center align-items-center px-2">
                        <div className="w-100">
                            <p className="fw-bold fs-3 m-0">{messages}</p>
                            <p className="fs-5 m-0 text-gray">messages</p>
                        </div>
                        <div className="w-100">
                            <p className={"fw-bold fs-3 m-0 text-" + (online ? "success" : "danger")}>{online ? "En ligne" : "Hors ligne"}</p>
                        </div>
                    </div>
                    {(isMe && profile.type === USERS_TYPE.DEFAULT) ?
                        <button onClick={e => handleLogout(e, integrationId, navigate)} className="btn btn-danger position-absolute start-50 translate-middle-x bottom-0 mb-5"><img height="20" className="align-text-bottom me-1" src="/images/logout.png" alt="logout" /> Se déconnecter</button>
                        : null}
                    <p className="position-absolute bottom-0 text-center text-secondary mb-2 w-100">Membre depuis {formatDuration(profile.date)}</p>
                </>}
            </div>
        </div>
    </>);
}

async function getMemberMessagesCount(id, setMessages) {
    try {
        const nb = await fetchMemberMessagesCount(id);
        setMessages(nb);
    } catch (error) { };
}

async function getProfile(id, setProfile) {
    try {
        const profile = await fetchProfile(id);
        setProfile(profile);
    } catch (error) { };
}

async function handleLogout(event, integrationId, navigate) {
    event.target.disabled = true;
    try {
        await logoutUser();
        resetSession();
        navigate("/login" + (integrationId ? "?to=/integrations/" + integrationId : ""));
    } catch (error) {
        event.target.disabled = false;
        console.error(error);
    };
}