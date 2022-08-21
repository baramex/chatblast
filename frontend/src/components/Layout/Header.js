import { Component } from "react";
import { logoutUser, resetSession } from "../../lib/service/authentification";

export default class Header extends Component {
    constructor(props) {
        super(props);

        this.handleLogout = this.handleLogout.bind(this);
    }

    async handleLogout(event) {
        event.target.disabled = true;
        try {
            await logoutUser();
            resetSession();
            this.props.navigation("/login");
        } catch (error) {
            event.target.disabled = false;
            console.error(error);
        }
    }

    accountMenu(ref) {
        ref.addEventListener("click", (event) => {
            ref.classList.toggle("active");
        });
    }

    render() {
        return (<>
            <header className="text-center position-relative d-flex justify-content-between align-items-center px-3">
                <div className="py-2 px-3 text-center d-flex justify-content-center align-items-center">
                    <div className="online-circle rounded-circle me-3"></div>
                    <span className="text-light fs-5">{((this.props.onlineCount || this.props.onlineCount === 0) ? this.props.onlineCount : "--") + " en ligne"}</span>
                </div>
                <h1 className="title text-light d-inline-block ms-5">ChatBlast</h1>
                <div className="position-relative">
                    <button ref={this.accountMenu} className="toggle-menu my-2 p-0 border-0 rounded-circle bg-light position-absolute top-0 end-0 me-3" data-bs-toggle="dropdown" aria-expanded="false" style={{ zIndex: 2 }}>
                        <img src="/profile/@me/avatar" alt="account-menu" />
                    </button>
                    <div className="shadow position-absolute top-0 end-0 rounded-4 px-5 py-3 mx-3 my-2 d-flex flex-column bg-light-theme menu" style={{ zIndex: 1 }}>
                        <p className="fw-bold fs-4">{sessionStorage.getItem("username")}</p>
                        <ul className="p-0 mb-0 mt-2" style={{ listStyle: "none" }}>
                            <li><button onClick={this.handleLogout} className="border-0 bg-transparent"><img width="25" className="me-2 align-bottom" src="/images/logout.png" alt="logout" />Se déconnecter</button></li>
                        </ul>
                    </div>
                </div>
            </header>
        </>);
    }
}