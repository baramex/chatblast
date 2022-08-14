import Message from "./Message";

export default function MessageContainer(props) {
    return (
        <div id="message-container">
            {props.messages && props.messages.map((message, i) => <Message {...message} viewed={props.viewed} deleteMessage={props.deleteMessage} scroll={(i === 19 && props.messages.length === 20) || props.scroll} behavior={props.scroll ? "smooth" : "auto"} key={message._id} />)}
        </div>
    );
}