import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOnline, fetchUser, isLogged } from "../../lib/service/authentification";
import { addToMessageToView, addToViewToSend, deleteMessageById, fetchMessages, fetchTyping, sendMarkAsRead, sendMessage, sendViews, setMessageTyping } from "../../lib/service/message";
import Header from "../Layout/Header";
import ConfirmPopup from "../Misc/ConfirmPopup";
import ErrorPopup from "../Misc/ErrorPopup";
import Loading from "../Misc/Loading";
import SuccessPopup from "../Misc/SuccessPopup";
import ObjectID from "bson-objectid";
import OnlineContaier from "./OnlineContainer";
import ProfileViewer from "./ProfilViewer";
import Message from "./Message";
const { io } = require("socket.io-client");
let socket;
let isInPage = true;

const notification = new Audio("/sounds/notification.wav");

export default function Home({ integrationId = undefined, logged = false }) {
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
    const [currentProfileView, setCurrentProfileView] = useState(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLogged() && !logged) return navigate("/login" + (integrationId ? "?to=/integrations/" + integrationId : ""));

        if (online && online.some(a => a.id === sessionStorage.getItem("id"))) setMessageTyping(false);

        if (!socket) {
            socket = io({ closeOnBeforeunload: true })
                .on("connected", () => {
                    getOnline(setOnline, setError);
                    getTyping(setTyping, setError);

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
                                return (prev || 0) + 1;
                            });
                            setTyping(prev => {
                                if (!prev) return;
                                return prev.filter(a => a.id !== message.author._id);
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
                            var unread_ = 0;
                            views.forEach(view => {
                                const index = curr.findIndex(a => a._id === view.id);
                                if (index !== -1) {
                                    curr[index].views = view.views;
                                    if (!curr[index].isViewed && view.isViewed) unread_++;
                                    curr[index].isViewed = view.isViewed;
                                }
                            });
                            setUnread(prev => Math.max((prev || 0) - unread_, 0));
                            return [...curr];
                        });
                    });
                    socket.on("profile.join", profile => {
                        setMessages(prev => {
                            if (!prev) return prev;
                            prev.push({
                                _id: ObjectID().toHexString(),
                                author: { username: "SYSTEM" },
                                mentions: [{ id: profile.id, username: profile.username }],
                                content: `{mention[0]} a rejoint la conversation.`,
                                ephemeral: true,
                                date: new Date().toISOString()
                            });
                            setUnread(prev => {
                                return (prev || 0) + 1;
                            });
                            return [...prev];
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
                                return (prev || 0) + 1;
                            });
                            return [...prev];
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
                        setTyping(prev => {
                            if (!prev) return;
                            if (_typing.isTyping && !prev.some(a => a.id === _typing.id)) return [...prev, { id: _typing.id, username: _typing.username }];
                            else if (!_typing.isTyping && prev.some(a => a.id === _typing.id)) return prev.filter(a => a.id !== _typing.id);
                            return prev;
                        });
                    });
                });
        } else {
            getOnline(setOnline, setError);
            getTyping(setTyping, setError);
        }

        getUser(setUnread, setError);
        getMessages(fetchedAll, messages, setMessages, setFetchedAll, setError);

        return () => {
            if (socket) {
                socket.disconnect();
                socket = undefined;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isLogged() && !logged) return null;

    return (<div onMouseEnter={() => handleMouseEnter(setUnread, setMessages)} onMouseLeave={handleMouseLeave} className="flex flex-col h-[100vh]">
        <ErrorPopup title={error?.title} message={error?.message} onClose={() => setError(undefined)} />
        <SuccessPopup title={success?.title} message={success?.message} onClose={() => setSuccess(undefined)} />
        <ConfirmPopup show={!!wantToDelete} title="Suppression message" message="Êtes-vous sûr de vouloir supprimer ce message ?" onConfirm={() => { confirmDeleteMessage(wantToDelete, setError, setMessages, setSuccess); setWantToDelete(undefined); }} onClose={() => setWantToDelete(undefined)} />
        <ProfileViewer onClose={() => setCurrentProfileView(null)} show={!!currentProfileView} integrationId={integrationId} profileId={currentProfileView} onlines={online} />

        <Header openProfileViewer={setCurrentProfileView} integrationId={integrationId} onlineCount={online?.length} onlines={online} />

        <div className="flex h-full">
            <OnlineContaier openProfileViewer={setCurrentProfileView} online={online} />

            <div className="w-full h-full flex flex-col bg-emerald-100">
                <div className={"group absolute flex items-center animate-bounce -ml-1 -mt-1 " + (!unread ? "hidden" : "")}>
                    <span className="rounded-3xl text-lg px-3 text-white bg-red-600 z-10">
                        {unread}
                    </span>
                    <button onClick={() => markAsRead(setUnread, setMessages)} className="transition-all bg-red-700 opacity-0 text-clip text-white border-0 overflow-hidden w-[0px] -ml-2.5 max-h-5 text-sm rounded-r-3xl group-hover:w-[165px] group-hover:opacity-100">marquer comme lu</button>
                </div>

                <div onScroll={fetchedAll ? null : fetching ? e => e.target.scrollTop === 0 ? e.target.scrollTop = 1 : null : e => handleChatScrolling(e, fetchedAll, messages, setMessages, setFetchedAll, setFetching, setFetchMessage, setError)} className="pt-3 overflow-auto h-100 position-relative" style={{ flex: "1 0px" }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        {
                            !messages ? <Loading width="w-14" height="h-14" /> : messages.length === 0 ? <p className="fs-4 text-neutral-500">Aucun message</p> : null
                        }
                    </div>
                    <div id="message-container">
                        {fetching ?
                            <div className="flex justify-center"><Loading /></div> : fetchedAll && messages && messages.length > 0 ? <p className="text-center text-neutral-500 m-0">Vous êtes arrivé au début de la discussion.</p> : null
                        }
                        {messages && messages.map((message, i) => {
                            return <Message {...message} openProfileViewer={setCurrentProfileView} intersect={intersect} setUnread={setUnread} setMessages={setMessages} deleteMessage={deleteMessage} setWantToDelete={setWantToDelete} scroll={(i === messages.length - 1 && messages.length <= 20) || newMessage || i._id === fetchMessage} behavior={newMessage ? "smooth" : "auto"} key={message._id} />;
                        })}
                    </div>
                </div>

                <div className="relative">
                    <span className="absolute left-0 ml-2 text-neutral-500 -top-6">
                        {typing?.filter(a => a.id !== sessionStorage.getItem("id")).length > 0 && (typing?.filter(a => a.id !== sessionStorage.getItem("id")).map(a => a.username).join(", ") + " " + (typing?.filter(a => a.id !== sessionStorage.getItem("id")).length === 1 ? "est" : "sont") + " en train d'écrire...")}
                    </span>
                    <form onSubmit={e => handleSendMessage(e, setError)} className="flex relative">
                        <div className="relative w-full">
                            <input
                                type="text"
                                name="message"
                                aria-label="Message"
                                minLength="1"
                                maxLength="512"
                                className="transition-shadow block w-full pl-3.5 pr-14 py-1.5 outline-none text-lg focus:shadow-inner"
                                autoComplete="off"
                                placeholder="Tapez votre message..."
                                onInput={(e) => handleInput(e, typing)}
                                disabled={messages ? false : true}
                                required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                                <input type="submit" disabled={messages ? false : true} className="drop-shadow-[0_0_5px_rgba(52,211,153,.4)] transition-colors mr-1.5 cursor-pointer border-0 bg-emerald-300 rounded-full hover:bg-emerald-400 w-11 h-7 bg-[length:25px] bg-no-repeat bg-center" style={{ backgroundImage: "url('/images/send.svg')" }} value="" />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
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
    if (event.target.scrollTop === 0) event.target.scrollTop = 1;
    if (!messages || messages.length < 20) return;
    if (event.target.scrollTop <= 50) {
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
        setError({ title: "Erreur d'envoie de message", message: error.message || error });
    }
    event.target.querySelectorAll("input").forEach(a => a.disabled = false);
    event.target.message.focus();
}

async function getUser(setUnread, setError) {
    try {
        const user = await fetchUser();
        setUnread(prev => (prev || 0) + user.unread);
        sessionStorage.setItem("id", user.id);
        sessionStorage.setItem("username", user.username);
        sessionStorage.setItem("type", user.type);
    } catch (error) {
        setError({ title: "Erreur de récupération utilisateur", message: error.message || error });
    }
}

async function getTyping(setTyping, setError) {
    try {
        const typing = await fetchTyping();
        setTyping(typing);
    } catch (error) {
        setError({ title: "Erreur de récupération", message: error.message || error });
    }
}

async function getOnline(setOnline, setError) {
    try {
        const online = await fetchOnline();
        setOnline(online);
    } catch (error) {
        setError({ title: "Erreur de récupération", message: error.message || error });
    }
}

async function getMessages(fetchedAll, mes, setMessages, setFetchedAll, setError) {
    try {
        if (fetchedAll) return;
        const messages = await fetchMessages(mes?.length || 0);
        setMessages(prev => {
            if (!prev) return messages.reverse();
            messages.reverse()
            messages.push(...prev);
            return messages;
        });
        setFetchedAll(messages.length < 20);
        return messages.length;
    } catch (error) {
        setError({ title: "Erreur de récupération des messages", message: error.message || error });
    }
}

function deleteMessage(id, setWantToDelete) {
    setWantToDelete(id);
}

async function confirmDeleteMessage(id, setError, setMessages, setSuccess) {
    try {
        await deleteMessageById(id);
        setMessages(prev => prev.filter(message => message._id !== id));
        setSuccess({ title: "Suppression message", message: "Message supprimé !" });
    } catch (error) {
        setError({ title: "Erreur de suppression", message: error.message || error });
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

function viewed(id, ephemeral) {
    if (isInPage) {
        addToViewToSend(id, ephemeral);
    } else addToMessageToView(id, ephemeral);
}

function intersect(id, ephemeral, setUnread, setMessages) {
    viewed(id, ephemeral);
    if (isInPage) sendViews(setUnread, setMessages);
}

function handleMouseEnter(setUnread, setMessages) {
    sendViews(setUnread, setMessages);

    isInPage = true;
}

function handleMouseLeave() {
    isInPage = false;
}