import { Component } from "react";
import Message from "./Message";

export default class MessageContainer extends Component {
    constructor(props) {
        super(props);

        this.viewed = this.viewed.bind(this);
    }

    viewed(id) {
        this.props.viewed(id);
    }

    render() {
        return (
            <div id="message-container">
                {this.props.messages && this.props.messages.map((message, i) => <Message {...message} viewed={this.viewed} scroll={i === 19 && this.props.messages.length === 20} key={message._id} />)}
            </div>
        )
    }
}