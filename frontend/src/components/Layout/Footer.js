import { Link } from "react-router-dom";

export default function Footer({ extra = "Conditions d'utilisation", extralink = "/terms", position = "fixed" }) {
    return (
        <>
            <footer className={`${position ? "position-" + position : ""} w-100 py-3 bottom-0 p-3 d-flex`}>
                <p className="mb-0 text-white w-100">Tous droits réservés 2022</p>
                <p className="mb-0 text-white w-100 text-center">Développé par <a rel="noreferrer" href="https://www.github.com/baramex" target="_blank">Baramex</a> & <a rel="noreferrer" href="https://github.com/vipexe" target="_blank">VipeX</a>
                </p>
                <p className="w-100 text-end mb-0"><Link to={extralink}>{extra}</Link></p>
            </footer>
        </>
    );
}