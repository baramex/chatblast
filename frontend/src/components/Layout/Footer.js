import { Link } from "react-router-dom";

export function Footer({ extra = "Conditions d'utilisation", extralink = "/terms" }) {
    return (
        <>
            <footer className="position-fixed w-100 py-3 bottom-0 text-center p-3 d-flex">
                <a rel="noreferrer" href="https://www.github.com/baramex/chatblast" target="_blank">Projet Github</a>
                <p className="mb-0 text-white">Développé par <a rel="noreferrer" href="https://www.github.com/baramex" target="_blank">Baramex</a> &
                    <a rel="noreferrer" href="https://github.com/vipexe" target="_blank">VipeX</a>
                </p>
                <Link to={extralink}>{extra}</Link>
            </footer>
        </>
    );
}