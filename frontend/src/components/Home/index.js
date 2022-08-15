import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOnline, getUser, isLogged } from "../../lib/service/authentification";
import { deleteMessageById, fetchMessages, fetchTyping, sendMessage, setTyping, setViewed } from "../../lib/service/message";
import Footer from "../Layout/Footer";
import Header from "../Layout/Header";
import ConfirmPopup from "../Misc/ConfirmPopup";
import ErrorPopup from "../Misc/ErrorPopup";
import Loading from "../Misc/Loading";
import SuccessPopup from "../Misc/SuccessPopup";
import MessageContainer from "./MessageContainer";
import OnlineContaier from "./OnlineContainer";
import ObjectID from "bson-objectid";
const { io } = require("socket.io-client");
let socket;

/**
 * TODO: remove server typing when profile leave/refresh (load page)
 * TODO: fixed socket disconnect
 * TODO: fetch message when scroll to top
 * */

export default function Home() {
    const [error, setError] = useState(undefined);
    const [success, setSuccess] = useState(undefined);
    const [wantToDelete, setWantToDelete] = useState(undefined);
    const [messages, setMessages] = useState(undefined);
    const [newMessage, setNewMessage] = useState(false);
    const [fetchedAll, setFetchedAll] = useState(false);
    const [unread, setUnread] = useState(undefined);
    const [typing, setTyping] = useState(undefined);
    const [online, setOnline] = useState(undefined);
    const [fetching, setFetching] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLogged()) return navigate("/login");

        console.log("init socket");
        socket = io();

        getMessages(fetchedAll, messages, setMessages, setFetchedAll, setError);
        getUnread(setUnread, setError);
        getTyping(setTyping, setError);
        getOnline(setOnline, setError);

        socket.on("message.delete", id => {
            setMessages(prev => {
                if (!prev) return;
                if (prev.some(a => a._id === id)) {
                    if (!prev.find(a => a._id === id).isViewed) setUnread(prev => {
                        if (!prev && prev !== 0) return;
                        return prev - 1;
                    });
                    return prev.filter(message => message._id !== id);
                }
            });
        });
        socket.on("message.send", message => {
            setMessages(prev => {
                if (!prev) return;

                setUnread(prev => {
                    if (!prev && prev !== 0) return;
                    return prev + 1;
                });
                setTyping(prev => {
                    if (!prev) return;
                    return prev.filter(a => a.id !== message.author.id);
                });
                setNewMessage(true);

                return [...prev, message];
            });
        });
        socket.on("messages.view", views => {
            setMessages(curr => {
                if (!curr) return;
                views.forEach(view => {
                    const index = curr.findIndex(a => a._id === view.id);
                    if (index !== -1) curr[index].views = view.views;
                });
                return [...curr];
            });
        });
        socket.on("profile.join", profile => {
            console.log("join", profile);
            setMessages(prev => {
                if (!prev) return;
                return [...prev, {
                    _id: ObjectID().toHexString(),
                    type: "system",
                    mentions: [{ id: profile.id, username: profile.username }],
                    content: `{mention[0]} a rejoint la conversation`,
                    date: new Date().toISOString()
                }];
            });
            setOnline(prev => {
                if (!prev) return;
                if (prev.find(a => a.id === profile.id)) return prev;
                return [...prev, profile];
            });
        });
        socket.on("profile.leave", profile => {
            console.log("leave", profile);
            setMessages(prev => {
                if (!prev) return;
                return [...prev, {
                    _id: ObjectID().toHexString(),
                    type: "system",
                    mentions: [{ id: profile.id, username: profile.username }],
                    content: `{mention[0]} a quitté la conversation`,
                    date: new Date().toISOString()
                }];
            });
            setTyping(prev => {
                if (!prev) return;
                return prev.filter(a => a.id !== profile.id);
            });
            setOnline(prev => {
                if (!prev) return;
                return prev.filter(a => a.id !== profile.id);
            });
        });
        socket.on("message.typing", _typing => {
            console.log("typing", _typing);
            setTyping(prev => {
                if (!prev) return;
                if (_typing.isTyping && !prev.some(a => a.id === _typing.id)) return [...prev, { id: _typing.id, username: _typing.username }];
                else if (!_typing.isTyping && prev.some(a => a.id === _typing.id)) return prev.filter(a => a.id !== _typing.id);
                return prev;
            });
        });

        return () => {
            console.log("events off");
            socket.off('message.delete');
            socket.off('message.send');
            socket.off('messages.view');
            socket.off('profile.join');
            socket.off('profile.leave');
            socket.off('message.typing');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isLogged()) return null;
    return (<div className="d-flex flex-column h-100">
        {error && <ErrorPopup message={error} onClose={() => setError("")} />}
        {success && <SuccessPopup message={success} onClose={() => setSuccess("")} />}
        {wantToDelete && <ConfirmPopup message="Êtes-vous sûr de vouloir supprimer ce message ?" onConfirm={() => { confirmDeleteMessage(wantToDelete, setError, setMessages, setSuccess); setWantToDelete(undefined); }} onClose={() => setWantToDelete(undefined)} />}

        <OnlineContaier online={online} onlineCount={online?.length} />

        <Header navigation={navigate} />
        <div id="chat" className="mx-5 mt-3 mb-4 h-100 d-flex flex-column rounded-3 position-relative">
            <span id="unread" className={"position-absolute badge rounded-pill fs-6 " + (unread > 0 ? "warning bg-danger" : "bg-primary")} style={{ marginTop: "-.25rem", marginLeft: "-.5rem" }}>
                {(!unread && unread !== 0) ? <Loading color="text-light" type="grow" size="sm" /> : unread}
            </span>

            <div onScroll={(fetchedAll || fetching) ? null : e => handleChatScrolling(e, fetchedAll, messages, setMessages, setFetchedAll, setFetching, setError)} className="px-5 py-4 mt-2 overflow-auto h-100 position-relative" style={{ flex: "1 0px" }}>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    {
                        !messages ? <Loading size="lg" /> : messages.length === 0 ? <p id="nomes" className="fs-4 text-secondary">Aucun message</p> : null
                    }
                </div>
                <MessageContainer fetching={fetching} scroll={newMessage} viewed={viewed(setUnread, setMessages)} deleteMessage={deleteMessage(setWantToDelete)} messages={messages} />
            </div>

            <form id="send-message" onSubmit={e => handleSendMessage(e, setError)} className="d-flex p-4 position-relative">
                <span className="position-absolute left-0 text-secondary" style={{ top: -30 }}>
                    {typing?.filter(a => a.id !== sessionStorage.getItem("id")).length > 0 && (typing.filter(a => a.id !== sessionStorage.getItem("id")).map(a => a.username).join(", ") + " " + (typing.length === 1 ? "est" : "sont") + " en train d'écrire...")}
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
    if ((e.nativeEvent.inputType === "insertText" && e.target.value.length === 1) || e.nativeEvent.inputType === "insertFromPaste") {
        if (!typing.find(a => a.id === sessionStorage.getItem("id"))) setTyping(true);
    } else if (e.target.value.length === 0) {
        if (typing.find(a => a.id === sessionStorage.getItem("id"))) setTyping(false);
    }
}

function handleChatScrolling(event, fetchedAll, messages, setMessages, setFetchedAll, setFetching, setError) {
    if (event.target.scrollTop <= 50) {
        setFetching(true);
        
        getMessages(fetchedAll, messages, setMessages, setFetchedAll, setError).finally(() => {
            setFetching(false);
        });
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
    event.target.message.focus();
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

async function getOnline(setOnline, setError) {
    try {
        const online = await fetchOnline();
        setOnline(online);
    } catch (error) {
        setError(error.message || error);
    }
}

async function getMessages(fetchedAll, mes, setMessages, setFetchedAll, setError) {
    try {
        if (fetchedAll) return;
        const messages = await fetchMessages(mes?.length || 0);
        setMessages(prev => {
            if (!prev) return messages.reverse();
            return [...messages.reverse(), ...prev];
        });
        setFetchedAll(messages.length < 20);
    } catch (error) {
        setError(error.message || error);
    }
}

function deleteMessage(setWantToDelete) {
    return (id) => {
        setWantToDelete(id);
    }
}

async function confirmDeleteMessage(id, setError, setMessages, setSuccess) {
    try {
        await deleteMessageById(id);
        setMessages(prev => prev.filter(message => message._id !== id));
        setSuccess("Message supprimé !");
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