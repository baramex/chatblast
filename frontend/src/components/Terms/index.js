import { Link } from "react-router-dom";
import Footer from "../Layout/Footer";
import Article from "./Article";

export default function Terms() {
    document.title = "ChatBlast | terms";

    return (<>
        <div className="container text-center pt-5 px-0" style={{marginBottom: 60}}>
            <h1><Link to="/" className="text-center text-decoration-none title">ChartBlast</Link></h1>
            <ol className="ps-0">
                <Article index="1" content="Une fois connecté, votre adresse IP, le pseudo choisi ainsi que votre fingerprint sont
                    enregistrés temporairement. Ces informations seront supprimées 2 heures plus tard, ou alors lors de
                    la déconnexion. Cette chatbox est avant tout anonyme, c'est pour cela que nous ne souvegardons pas
                    les données."/>
                <Article index="2" content="Le nom d'utilisateur doit être conforme et ne pas contenir de mots vulgaires.
                    L'usurpation d'identité, se faire passer pour une personne que nous ne sommes pas, est strictement
                    interdit. Les messages ne doivent pas atteindre à une personne, ou un groupe de personne."/>
                <Article index="3" content="Le nom d'utilisateur doit être conforme et ne pas contenir de mots vulgaires.
                    L'usurpation d'identité, se faire passer pour une personne que nous ne sommes pas, est strictement
                    interdit. Les messages ne doivent pas atteindre à une personne, ou un groupe de personne."/>
            </ol>
        </div>
        <Footer extra="Accueil" extralink="/" />
    </>);
}