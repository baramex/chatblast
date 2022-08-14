import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, isLogged } from "../../lib/service/authentification";
import { fetchMessages, fetchTyping, sendMessage, setTyping, setViewed } from "../../lib/service/message";
import { socket } from "../../lib/service/webSocket";
import Footer from "../Layout/Footer";
import Header from "../Layout/Header";
import ErrorPopup from "../Misc/ErrorPopup";
import Loading from "../Misc/Loading";
import MessageContainer from "./MessageContainer";

export default function Home() {
    const [error, setError] = useState(undefined);
    const [messages, setMessages] = useState(undefined);
    const [fetchedAll, setFetchedAll] = useState(false);
    const [from, setFrom] = useState(0);
    const [unread, setUnread] = useState(undefined);
    const [typing, setTyping] = useState(undefined);
    const navigate = useNavigate();

    function getMessagesState() {
        return messages;
    }
    function getTypingState() {
        return typing;
    }

    useEffect(() => {
        console.log("useEffect");
        if (!isLogged()) return navigate("/login");

        getMessages(fetchedAll, from, setFrom, setMessages, setFetchedAll, setError);
        getUnread(setUnread, setError);
        getTyping(setTyping, setError);

        socket.on("message.delete", id => {
            const messages = getMessagesState();
            if (!messages) return;
            if (messages.some(a => a._id === id)) setMessages(prev => prev.filter(message => message._id !== id));
        });

        socket.on("message.send", message => {
            const messages = getMessagesState();
            if (!messages) return;
            setMessages(prev => [...prev, message]);
        });

        socket.on("message.typing", _typing => {
            const typing = getTypingState();
            if (!typing) return;
            if (typing.some(a => a.id === typing.id)) setTyping([...typing, _typing]);
        });

        socket.on("message.view", viewed => {
            const messages = getMessagesState();
            if (!messages) return;
            if (messages.some(a => a._id === viewed && !a.isViewed)) setMessages(prev => prev.map(message => message._id === viewed ? { ...message, isViewed: true } : message));
        });

        socket.on("profile.join", profile => {

        });

        socket.on("profile.leave", profile => {

        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (<div className="d-flex flex-column h-100">
        {error && <ErrorPopup message={error} onClose={() => setError("")}></ErrorPopup>}

        <Header navigation={navigate} />
        <div id="chat" className="mx-5 mt-3 mb-4 h-100 d-flex flex-column rounded-3 position-relative">
            <span id="unread" className={"position-absolute badge rounded-pill bg-danger fs-6"} style={{ marginTop: "-.25rem", marginLeft: "-.5rem" }}>
                {unread === undefined ? <Loading color="text-light" type="grow" size="sm" /> : unread}
            </span>

            <div className="px-5 py-4 mt-2 overflow-auto h-100 position-relative" style={{ flex: "1 0px" }}>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    {
                        !messages ? <Loading size="lg" /> : messages.length === 0 ? <p id="nomes" className="fs-4 text-secondary">Aucun message</p> : null
                    }
                </div>
                <MessageContainer viewed={viewed(setUnread, setMessages)} messages={messages} />
            </div>

            <form id="send-message" onSubmit={e => handleSendMessage(e, setError)} className="d-flex p-4 position-relative">
                <span className="position-absolute left-0 mb-3 text-secondary" style={{ top: -35 }}>
                    {typing && typing.map(a => a.username).join(", ")}
                </span>
                <div className="input-group me-3">
                    <input type="text" onInput={e => handleInput(e, typing)} autoComplete="off" placeholder="Message..." className="form-control form-inset fs-6" name="message" aria-label="Message" minLength="1" maxLength="512" disabled={messages ? false : true} required />
                </div>
                <input type="submit" disabled={messages ? false : true} className="px-3 btn btn-success fs-5" />
            </form>
        </div>
        <Footer position={null} />
    </div>);
}

function handleInput(e, typing) {
    if ((e.inputType === "insertText" && e.target.value.length === 1) || e.inputType === "insertFromPaste") {
        if (!typing.find(a => a.id === sessionStorage.getItem("id"))) setTyping(true);
    } else if (e.target.value.length === 0) {
        if (typing.find(a => a.id === sessionStorage.getItem("id"))) setTyping(false);
    }
}

async function handleSendMessage(event, setError) {
    event.preventDefault();

    event.target.querySelectorAll("input").forEach(a => a.disabled = true);
    try {
        const message = event.target.message.value;

        await sendMessage(message);

        event.target.message.value = "";
    } catch (error) {
        setError(error.message || error);
    }
    event.target.querySelectorAll("input").forEach(a => a.disabled = false);
}

async function getUnread(setUnread, setError) {
    try {
        const user = await getUser();
        setUnread(user.unread);
    } catch (error) {
        setError(error.message || error);
    }
}

async function getTyping(setTyping, setError) {
    try {
        const typing = await fetchTyping();
        setTyping(typing);
    } catch (error) {
        setError(error.message || error);
    }
}

async function getMessages(fetchedAll, from, setFrom, setMessages, setFetchedAll, setError) {
    try {
        if (fetchedAll) return;
        const messages = await fetchMessages(from);
        setMessages(messages.reverse());
        setFetchedAll(messages.length === 0);
        setFrom(prev => prev + 20);
    } catch (error) {
        setError(error.message || error);
    }
}

function viewed(setUnread, setMessages) {
    return (id) => {
        setViewed([id]);
        setUnread(prev => prev - 1);
        setMessages(prev => prev.map(message => message._id === id ? { ...message, isViewed: true } : message));
    };
}