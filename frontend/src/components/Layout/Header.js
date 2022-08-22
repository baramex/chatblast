import { createRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, resetSession } from "../../lib/service/authentification";

export default function Header({ onlineCount }) {
    const button = createRef();
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

    return (<>
        <header className="text-center position-relative d-flex justify-content-between align-items-center px-3">
            <div className="py-2 px-3 d-flex justify-content-start align-items-center w-100">
                <div className="online-circle rounded-circle me-3"></div>
                <span className="text-light fs-5">{((onlineCount || onlineCount === 0) ? onlineCount : "--") + " en ligne"}</span>
            </div>
            <h1 className="title text-light d-inline-block">ChatBlast</h1>
            <div className="position-relative w-100 h-100">
                <button ref={button} className="toggle-menu px-0 py-1 border-0 rounded-circle position-absolute top-0 end-0 bg-transparent h-100" data-bs-toggle="dropdown" aria-expanded="false" style={{ zIndex: 2 }}>
                    <img className="rounded-circle bg-light h-100" src="/profile/@me/avatar" alt="account-menu" />
                </button>
                <div className="shadow-lg position-absolute top-0 end-0 mt-1 d-flex flex-column bg-light-theme menu" style={{ zIndex: 1 }}>
                    <p className="fw-bold fs-4 mt-3" style={{ color: "#737373", marginRight: 60, marginLeft: 60 }}>{sessionStorage.getItem("username")}</p>
                    <ul className="p-0 m-0" style={{ listStyle: "none" }}>
                        <li><button onClick={e => handleLogout(e, navigate)} className="border-0 bg-transparent pb-3 px-5"><img width="25" className="me-2 align-bottom" src="/images/logout.png" alt="logout" />Se déconnecter</button></li>
                    </ul>
                </div>
            </div>
        </header>
    </>);
}

async function handleLogout(event, navigate) {
    event.target.disabled = true;
    try {
        await logoutUser();
        resetSession();
        navigate("/login")
    } catch (error) {
        event.target.disabled = false;
        console.error(error);
    }
}