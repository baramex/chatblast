import { handleLogout } from "../../lib/hooks/authentification";

export default function Header() {
    return (<>
        <header className="text-center position-relative">
            <h1 className="title d-inline-block ms-5">ChatBlast</h1>
            <button onclick={handleLogout} id="disconnect"
                className="btn btn-danger btn-lg position-absolute end-0 top-50 translate-middle-y me-5 px-4">Se
                déconnecter</button>
            <button onclick={handleLogout} id="disconnect-img"
                className="position-absolute end-0 top-50 translate-middle-y me-4 border-0 bg-transparent" hidden>
                <img width="60" src="/images/logout.png" alt="logout" />
            </button>
        </header>
    </>);
}