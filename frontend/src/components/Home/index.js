import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOnline, getUser, isLogged } from "../../lib/service/authentification";
import { addToMessageToView, addToViewToSend, deleteMessageById, fetchMessages, fetchTyping, sendMarkAsRead, sendMessage, sendViews, setMessageTyping } from "../../lib/service/message";
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
let observer;
let isInPage = true;

const notification = new Audio("/sounds/notification.wav");

export default function Home() {
    const [error, setError] = useState(undefined);
    const [success, setSuccess] = useState(undefined);
    const [wantToDelete, setWantToDelete] = useState(undefined);
    const [messages, setMessages] = useState(undefined);
    const [newMessage, setNewMessage] = useState(false);
    const [fetchMessage, setFetchMessage] = useState(false);
    const [fetchedAll, setFetchedAll] = useState(false);
    const [unread, setUnread] = useState(undefined);
    const [typing, setTyping] = useState(undefined);
    const [online, setOnline] = useState(undefined);
    const [fetching, setFetching] = useState(false);
    const navigate = useNavigate();

    if (!observer) observer = new IntersectionObserver(e => intersect(e, setUnread, setMessages));

    useEffect(() => {
        if (!isLogged()) return navigate("/login");

        if (online && online.some(a => a.id === sessionStorage.getItem("id"))) setMessageTyping(false);

        console.log("init home");
        if (!socket) socket = io().on("connect", () => {
            socket.on("message.delete", id => {
                setMessages(prev => {
                    if (!prev) return;
                    if (prev.some(a => a._id === id)) {
                        if (!prev.find(a => a._id === id).isViewed) setUnread(prev => {
                            if (!prev && prev !== 0) return;
                            return Math.max(0, prev - 1);
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

                    prev.push(message);

                    return prev;
                });

                if (!isInPage) notification.play().catch(() => { });
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
                    prev.push({
                        _id: ObjectID().toHexString(),
                        author: { username: "SYSTEM" },
                        mentions: [{ id: profile.id, username: profile.username }],
                        content: `{mention[0]} a rejoint la conversation.`,
                        ephemeral: true,
                        date: new Date().toISOString()
                    });
                    setUnread(prev => {
                        if (!prev && prev !== 0) return;
                        return prev + 1;
                    });
                    return prev;
                });
                setOnline(prev => {
                    if (!prev) return;
                    if (prev.find(a => a.id === profile.id)) return prev;
                    prev.push(profile);
                    return prev;
                });

                notification.play().catch(() => { });
            });
            socket.on("profile.leave", profile => {
                console.log("leave", profile);
                setMessages(prev => {
                    if (!prev) return;
                    prev.push({
                        _id: ObjectID().toHexString(),
                        author: { username: "SYSTEM" },
                        mentions: [{ id: profile.id, username: profile.username }],
                        content: `{mention[0]} a quitté la conversation.`,
                        ephemeral: true,
                        date: new Date().toISOString()
                    });
                    setUnread(prev => {
                        if (!prev && prev !== 0) return;
                        return prev + 1;
                    });
                    return prev;
                });
                setTyping(prev => {
                    if (!prev) return;
                    return prev.filter(a => a.id !== profile.id);
                });
                setOnline(prev => {
                    if (!prev) return;
                    return prev.filter(a => a.id !== profile.id);
                });

                notification.play().catch(() => { });
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
        });

        getMessages(fetchedAll, messages, setMessages, setFetchedAll, setError);
        getUnread(setUnread, setError);
        getTyping(setTyping, setError);
        getOnline(setOnline, setError);

        return () => {
            console.log("events off");
            if (socket) {
                socket.off('message.delete');
                socket.off('message.send');
                socket.off('messages.view');
                socket.off('profile.join');
                socket.off('profile.leave');
                socket.off('message.typing');
                socket.disconnect();
                socket = undefined;
            }
            if(observer) {
                observer.disconnect();
                observer = undefined;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isLogged()) return null;
    return (<div onMouseEnter={() => handleMouseEnter(setUnread, setMessages)} onMouseLeave={handleMouseLeave} className="d-flex flex-column h-100">
        {error && <ErrorPopup message={error} onClose={() => setError("")} />}
        {success && <SuccessPopup message={success} onClose={() => setSuccess("")} />}
        {wantToDelete && <ConfirmPopup message="Êtes-vous sûr de vouloir supprimer ce message ?" onConfirm={() => { confirmDeleteMessage(wantToDelete, setError, setMessages, setSuccess); setWantToDelete(undefined); }} onClose={() => setWantToDelete(undefined)} />}

        <OnlineContaier online={online} onlineCount={online?.length} />

        <Header navigation={navigate} />
        <div id="chat" className="mx-5 mt-3 mb-4 h-100 d-flex flex-column rounded-3 position-relative">
            <div className="position-absolute d-flex align-items-center" style={{ marginTop: "-.25rem", marginLeft: "-.5rem" }}>
                <span id="unread" className={"badge rounded-pill fs-6 " + (unread > 0 ? "warning bg-danger" : "bg-primary")} style={{ zIndex: 3, cursor: "default" }}>
                    {(!unread && unread !== 0) ? <Loading color="text-light" type="grow" size="sm" /> : unread}
                </span>
                <button onClick={() => markAsRead(setUnread, setMessages)} className="btn-unread text-white border-0 text-start">marquer comme lu</button>
            </div>

            <div onScroll={(fetchedAll || fetching) ? null : e => handleChatScrolling(e, fetchedAll, messages, setMessages, setFetchedAll, setFetching, setFetchMessage, setError)} className="px-5 py-4 mt-2 overflow-auto h-100 position-relative" style={{ flex: "1 0px" }}>
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    {
                        !messages ? <Loading size="lg" /> : messages.length === 0 ? <p id="nomes" className="fs-4 text-secondary">Aucun message</p> : null
                    }
                </div>
                <MessageContainer observer={observer} fetchedAll={fetchedAll} fetching={fetching} scroll={newMessage} fetchMessage={fetchMessage} deleteMessage={deleteMessage(setWantToDelete)} messages={messages} />
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
    </div >);
}

function handleInput(e, typing) {
    if ((e.nativeEvent.inputType === "insertText" && e.target.value.length === 1) || e.nativeEvent.inputType === "insertFromPaste") {
        if (!typing.find(a => a.id === sessionStorage.getItem("id"))) setMessageTyping(true);
    } else if (e.target.value.length === 0) {
        if (typing.find(a => a.id === sessionStorage.getItem("id"))) setMessageTyping(false);
    }
}

function handleChatScrolling(event, fetchedAll, messages, setMessages, setFetchedAll, setFetching, setFetchMessage, setError) {
    if (event.target.scrollTop <= 50) {
        if (event.target.scrollTop == 0) event.target.scrollTop = 1;

        setFetching(true);

        let firstMessage = messages[0]._id;
        getMessages(fetchedAll, messages, setMessages, setFetchedAll, setError).finally(() => {
            setFetching(false);
            setFetchMessage(firstMessage);
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
            messages.push(...prev);
            return messages;
        });
        setFetchedAll(messages.length < 20);
        return messages.length;
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

function markAsRead(setUnread, setMessages) {
    sendMarkAsRead().then(() => {
        setUnread(0);
        setMessages(prev => prev.map(message => {
            message.isViewed = true;
            return message;
        }));
    });
}

function viewed(id) {
    if (isInPage) {
        addToViewToSend(id);
    } else addToMessageToView(id);
}

function intersect(entries, setUnread, setMessages) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            viewed(entry.target.id.replace("m-", ""));
        }
    });
    if (isInPage) sendViews(setUnread, setMessages);
}

function handleMouseEnter(setUnread, setMessages) {
    sendViews(setUnread, setMessages);

    isInPage = true;
    console.log("enter");
}

function handleMouseLeave() {
    isInPage = false;
    console.log("leave");
}