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
            console.log(error);
        }
    }

    render() {
        return (<>
            <header className="text-center position-relative">
                <h1 className="title d-inline-block ms-5">ChatBlast</h1>
                <button onClick={this.handleLogout} id="disconnect"
                    className="btn btn-danger btn-lg position-absolute end-0 top-50 translate-middle-y me-5 px-4">Se
                    déconnecter</button>
                <button onClick={this.handleLogout} id="disconnect-img"
                    className="position-absolute end-0 top-50 translate-middle-y me-4 border-0 bg-transparent" hidden>
                    <img width="60" src="/images/logout.png" alt="logout" />
                </button>
            </header>
        </>);
    }
}