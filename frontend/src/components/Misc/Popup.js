import { Component } from "react";
import { Link } from "react-router-dom";
import HiddenTab from "./HiddenTab";

export default class Popup extends Component {
    constructor(props) {
        super(props);

        this.state = {
            closed: false,
            action: ""
        }

        this.handleConfirm = this.handleConfirm.bind(this);
        this.close = this.close.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    handleConfirm() {
        this.setState({ closing: true, action: "terms" });
    }

    handleClose() {
        this.setState({ closing: true, action: "close" });
    }

    handleCancel() {
        this.setState({ closing: true, action: "cancel" });
    }

    close(e) {
        e.target.hidden = true;
        this.setState({ closed: true });
        if (this.state.action === "terms" && this.props.onConfirm) this.props.onConfirm();
        else if (this.props.onClose) this.props.onClose();
    }

    render() {
        if (this.state.closed) return;

        return (<>
            <HiddenTab onClick={() => this.props.canClose ? this.handleClose : null} />
            <div role="alert" className={"popup popup-status text-center px-5 py-4 bg-light top-50 start-50 position-absolute rounded-3 " + (this.state.closing ? "popup-closing" : "popup-coming")} onAnimationEnd={!this.state.closing ? (e) => e.target.classList.remove("popup-coming") : this.close}>
                <img src={`/images/${this.props.type === "terms" ? "warning" : this.props.type}.png`} width="150" alt={this.props.type} />
                <p className="text-dark fs-4 fm-sans-serif">{this.props.type === "terms" ? <>Vous devez accepter les <Link to="/terms" target="_blank">conditions d'utilisations</Link> pour continuer.</> : this.props.message}</p>
                {
                    this.props.canClose ?
                        <>{
                            this.props.type === "terms" ?
                                <button className="btn btn-danger px-3 py-2 mx-3" disabled={this.state.closing} onClick={this.handleCancel}>Annuler</button> :
                                null
                        }
                            < button className={`btn btn-${(this.props.type === "valid" || this.props.type === "terms") ? "success" : this.props.type === "error" ? "danger" : "info"} px-3 py-2${this.props.type === "info" ? " text-white" : this.props.type === "terms" ? " mx-3" : ""}`} disabled={this.state.closing} onClick={this.handleConfirm}>{this.props.type === "terms" ? "Oui" : "Ok"}</button>
                        </> : null}
            </div>
        </>);
    }
}