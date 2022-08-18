import Loading from "../Misc/Loading";
import Message from "./Message";

export default function MessageContainer(props) {
    console.log(props.messages);
    return (
        <div id="message-container">
            {props.fetching ?
                <div className="text-center"><Loading /></div> : props.fetchedAll ? <p className="text-center fs-6 text-secondary m-0">Vous êtes arrivé au début de la discussion.</p> : null
            }
            {props.messages && props.messages.map((message, i) => {
                return <Message {...message} observer={props.observer} deleteMessage={props.deleteMessage} scroll={(i === props.messages.length - 1 && props.messages.length <= 20) || props.scroll || i._id === props.fetchMessage} behavior={props.scroll ? "smooth" : "auto"} key={message._id} />;
            })}
        </div>
    );
}