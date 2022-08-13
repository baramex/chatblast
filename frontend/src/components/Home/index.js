import { Component } from "react";
import { Footer } from "../Layout/Footer";
import Header from "../Layout/Header";

export default class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            error: null,
            messages: []
        }
    }

    render() {
        return (
            <>
                <Header navigation={this.props.navigation} />

                <div id="chat" className="mx-5 mt-3 mb-4 h-100 d-flex flex-column rounded-3 position-relative">
                    <span id="unread" className="position-absolute badge rounded-pill bg-danger fs-6" style={{ marginTop: "-.25rem", marginLeft: "-.5rem" }}>0</span>

                    <div className="px-5 py-4 mt-2 overflow-auto h-100 position-relative" style={{ flex: "1 0" }}>
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                            <p id="nomes" className="fs-4 text-secondary" hidden>
                                Aucun message
                            </p>
                            <div className="spinner-border text-theme" id="message-spinner" style={{ width: "3rem", height: "3rem" }} role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div id="message-container" hidden>
                        </div>
                    </div>

                    <form id="send-message" className="d-flex p-4 position-relative">
                        <span id="typing" className="position-absolute left-0 mb-3 text-secondary" style={{ top: -35 }}></span>
                        <div className="input-group me-3">
                            <span className="input-group-text fs-5" id="inputGroup-sizing-default">Message</span>
                            <input type="text" autoComplete="off" placeholder="Message..." className="form-control form-inset fs-5" name="message" aria-label="Message" minLength="1" maxLength="256" required />
                        </div>
                        <input type="submit" className="px-3 btn btn-success fs-5" />
                    </form>
                </div>

                <Footer />
            </>);
    }
}