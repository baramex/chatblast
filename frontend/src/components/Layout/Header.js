import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser, resetSession, USERS_TYPE } from "../../lib/service/authentification";
import HiddenTab from "../Misc/HiddenTab";

export default function Header({ onlineCount, onlines, openProfileViewer, integrationId }) {
    const button = useRef();
    const burger = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if (!button.current) return;

        const currentButton = button.current;

        const docCallback = () => {
            currentButton.classList.remove("active");
        };

        const buttonCallback = (event) => {
            event.stopPropagation();
            currentButton.classList.toggle("active");
        };

        currentButton.addEventListener("click", buttonCallback);

        document.addEventListener("click", docCallback);

        return () => {
            currentButton.removeEventListener("click", buttonCallback);
            document.removeEventListener("click", docCallback);
        };
    }, [button]);

    useEffect(() => {
        if (!burger.current) return;

        const currentBurger = burger.current;

        const burgerCallback = (event) => {
            event.stopPropagation();
            const active = currentBurger.parentElement.classList.toggle("active");
            const tab = document.getElementById("burger-tab");
            if (tab) {
                if (active) {
                    tab.hidden = false;
                    tab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
                }
                else {
                    tab.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => tab.hidden = true;
                }
            }
        }

        currentBurger.addEventListener("click", burgerCallback);

        return () => {
            currentBurger.removeEventListener("click", burgerCallback);
        }
    }, [burger]);

    return (<>
        <header className="text-center position-relative d-flex justify-content-between align-items-center px-3 py-1">
            <div className="w-100">
                <div className="py-2 px-3 d-flex justify-content-start align-items-center onlines">
                    <div className="online-circle rounded-circle me-3"></div>
                    <span className="text-light fs-5">{((onlineCount || onlineCount === 0) ? onlineCount : "--") + " en ligne"}</span>
                </div>

                <div className="burger" hidden>
                    <button ref={burger} className="position-relative w-100 h-100 bg-transparent border-0 p-0">
                        <span></span>
                    </button>

                    <ul className="menu position-absolute top-0 start-0 pt-5 px-0 rounded-0 text-start">
                        <li className="d-flex align-items-center mt-4 px-3">
                            <img width="55" height="55" className="rounded-circle bg-light object-fit-cover" src={`/profile/${sessionStorage.getItem("id")}/avatar`} alt="account-menu" />
                            <p className="fw-bold fs-4 ms-3 text-white m-0 flex-grow-1">{sessionStorage.getItem("username")}</p>
                            <button className="bg-transparent border-0" onClick={() => openProfileViewer(sessionStorage.getItem("id"))}><img width="25" src="/images/settings.svg" alt="settings" /></button>
                        </li>
                        <li className="px-3">
                            {
                                Number(sessionStorage.getItem("type")) === USERS_TYPE.ANONYME ? <Link to={"/login" + (integrationId ? "?to=/integrations/" + integrationId : "")}>connectez-vous</Link> : Number(sessionStorage.getItem("type")) === USERS_TYPE.OAUTHED ? null : <button onClick={e => handleLogout(e, integrationId, navigate)} className="btn btn-danger w-100 py-2 fs-5 rounded-pill mt-3 mb-2">Se déconnecter</button>
                            }
                        </li>
                        <li className="mb-2 mt-4 px-3"><span className="text-white fs-5">{((onlineCount || onlineCount === 0) ? onlineCount : "--") + " en ligne"}</span></li>
                        {
                            onlines && onlines.map(online => <li role="button" onClick={() => openProfileViewer(online.id)} className="online d-flex align-items-center py-2 li-btn px-4" key={online.id}>
                                <img width="50" height="50" className="rounded-circle object-fit-cover" src={`/profile/${online.id}/avatar`} alt="avatar" />
                                <p className="mb-0 ms-2 text-white">{online.username}</p>
                            </li>)
                        }
                    </ul>
                </div>
            </div>
            <h1 className="title text-light d-inline-block m-0">ChatBlast</h1>
            <div className="position-relative w-100 h-100">
                <button ref={button} className="toggle-menu px-0 py-1 border-0 rounded-circle position-absolute top-0 end-0 bg-transparent h-100" aria-expanded="false" style={{ zIndex: 2 }}>
                    <img className="rounded-circle bg-light h-100 object-fit-cover" style={{ aspectRatio: "1/1" }} src={`/profile/${sessionStorage.getItem("id")}/avatar`} alt="account-menu" />
                </button>
                <div className="shadow-lg position-fixed top-0 end-0 me-3 mt-1 d-flex flex-column bg-light-theme menu" style={{ zIndex: 1 }}>
                    <p className="fw-bold fs-4 mt-2" style={{ color: "#737373", marginRight: 60, marginLeft: 60 }}>{sessionStorage.getItem("username")}</p>
                    <ul className="p-0 m-0" style={{ listStyle: "none" }}>
                        <li><button onClick={e => handleLogout(e, integrationId, navigate)} className="border-0 bg-transparent pb-3 px-5"><img width="25" className="me-2 align-bottom" src="/images/logout.png" alt="logout" />Se déconnecter</button></li>
                    </ul>
                </div>
            </div>
        </header>
        <HiddenTab id="burger-tab" hidden />
    </>);
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
    }
}