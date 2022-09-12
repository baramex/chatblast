import { useState } from "react";
import { fetchMemberMessagesCount } from "../../lib/service/message";
import { formatDuration } from "../../lib/utils/date";
import HiddenTab from "./HiddenTab";

export default function ProfileViewer({ profile }) {
    const [messages, setMessages] = useState(undefined);

    if (!messages && messages !== 0) getMemberMessagesCount(profile._id, setMessages);
    const isMe = profile._id === sessionStorage.getItem("id");

    return (<>
        <HiddenTab />
        <div className="d-flex position-absolute top-50 start-50 translate-middle flex-column container" style={{ height: "80%", minWidth: "400px", width: "40%", zIndex: 70 }}>
            <div className="rounded-4 rounded-bottom-0 w-100" style={{ height: "30%", backgroundColor: "#2DBF8F" }}>
                <button className="border-0 bg-transparent m-2" style={{ transform: "rotate(180deg)" }}><img width="35" src="/images/arrow.png" alt="return" /></button>
                <div className="position-absolute start-50 translate-middle-x mt-3 text-center" style={{ zIndex: 5 }}>
                    <div className="rounded-circle p-2" style={{ backgroundColor: "#138F63", width: "120px", height: "120px" }}>
                        <button className={"border-0 w-100 h-100 p-0 position-relative overflow-hidden bg-transparent rounded-circle" + (isMe ? " profile-avatar-change" : "")}>
                            <img src={"/profile/" + profile._id + "/avatar"} className="object-fit-cover w-100 h-100" style={{ aspectRatio: "1/1" }} alt="avatar" />
                            {isMe ? <div style={{ backgroundColor: "rgba(30, 30, 30, .7)", transform: "translate(-50%, 100%)", transition: "transform .3s ease-in-out" }} className="position-absolute bottom-0 start-50 w-100 py-1 pb-2 d-flex align-items-center justify-content-center">
                                <img style={{ opacity: ".8" }} src="/images/camera.png" height="20" alt="camera" />
                            </div> : null}
                        </button>
                    </div>
                    <div>
                        <p className="fs-2 fw-bold d-inline me-2">{profile.username}</p>{isMe ? <button className="bg-transparent border-0 align-text-bottom"><img src="/images/edit.png" width="20" alt="edit" /></button> : null}
                    </div>
                </div>
            </div>
            <div className="flex-grow-1 rounded-4 rounded-top-0 w-100 d-flex align-items-center position-relative" style={{ backgroundColor: "#D7F5EA" }}>
                <div className="d-flex w-100 text-center align-items-center px-2">
                    <div className="w-100">
                        <p className="fw-bold fs-3 m-0">{messages}</p>
                        <p className="fs-5 m-0 text-gray">messages</p>
                    </div>
                    <div className="w-100">
                        <p className={"fw-bold fs-3 m-0 text-" + (profile.online ? "success" : "danger")}>{profile.online ? "En ligne" : "Hors ligne"}</p>
                    </div>
                </div>
                <p className="position-absolute bottom-0 text-center text-secondary mb-2 w-100">Membre depuis {formatDuration(profile.date)}</p>
            </div>
        </div>
    </>);
}

async function getMemberMessagesCount(id, setMessages) {
    try {
        const nb = await fetchMemberMessagesCount(id);
        setMessages(nb);
    } catch (error) { }
}