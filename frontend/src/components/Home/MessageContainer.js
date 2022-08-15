import Loading from "../Misc/Loading";
import Message from "./Message";

export default function MessageContainer(props) {
    return (
        <div id="message-container">
            {props.fetching ?
                <Loading /> : null
            }
            {props.messages && props.messages.map((message, i) => {
                return <Message {...message} viewed={props.viewed} deleteMessage={props.deleteMessage} scroll={(i === props.messages.length - 1 && props.messages.length <= 20) || props.scroll} behavior={props.scroll ? "smooth" : "auto"} key={message._id} />;
            })}
        </div>
    );
}