import { Link } from "react-router-dom";

export default function Footer({ extra = "Conditions d'utilisation", extralink = "/terms" }) {
    return (
        <>
            <footer className={`w-full p-4 bottom-0 flex bg-emerald-700`}>
                <p className="mb-0 text-white w-full hidden sm:block">Tous droits réservés 2022</p>
                <p className="mb-0 text-white w-full text-center">Développé par <a rel="noreferrer" href="https://www.github.com/baramex" target="_blank">Baramex</a> & <a rel="noreferrer" href="https://github.com/vipexe" target="_blank">VipeX</a>
                </p>
                <p className="w-full text-right text-white mb-0 hidden sm:block"><Link target={extralink === "/terms" ? "_blank" : ""} to={extralink}>{extra}</Link></p>
            </footer>
        </>
    );
}