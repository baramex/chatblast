import { createRef, memo, useEffect } from "react";
import useElementOnScreen from "../../lib/hooks/useElementOnScreen";

function Message(props) {
    const date = new Date(props.date);

    const isSystem = props.author?.username === "SYSTEM";
    const isMy = !isSystem && props.author?._id === sessionStorage.getItem("id");
    const formattedDate = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    let content = props.content;

    const message = createRef();
    const isVisible = useElementOnScreen(message, true, props.isViewed);

    if (isSystem) {
        if (props.mentions) {
            let mentionIntance = props.content.match(/{mention\[[0-9]{1,}\]}/g);
            let tempContent = content;
            mentionIntance?.forEach(mention => {
                let index = mention.match(/[0-9]{1,}/)[0];
                let name = props.mentions[index] ? props.mentions[index].id === sessionStorage.getItem("id") ? "vous" : "@" + props.mentions[index].username : "invaliduser";
                tempContent = tempContent.replace(mention, `<strong>${name}</strong>`);
            });
            content = tempContent;
        }
    }

    useEffect(() => {
        if (isVisible) {
            props.intersect(props._id, props.ephemeral, props.setUnread, props.setMessages);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    useEffect(() => {
        let element = message.current;
        if (!element) return;

        if (props.scroll && (props.behavior === "smooth" ? element.parentElement.parentElement.scrollHeight - element.parentElement.parentElement.scrollTop - 951 < 200 : true)) {
            let scroll = element.parentElement.parentElement.scrollTop;
            element.scrollIntoView({ behavior: props.behavior || "auto" });
            let i = 0;
            if (props.behavior === "smooth") checkScroll();
            let messageCopy = element;

            function checkScroll() {
                if (i >= 3) return;
                setTimeout(() => {
                    if (messageCopy) {
                        let diff = messageCopy.parentElement.parentElement.scrollTop - scroll;
                        if (diff === 0) {
                            messageCopy.scrollIntoView({ behavior: props.behavior || "auto" });
                            checkScroll();
                        }
                    }
                }, 25);
                i++;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={message} id={"m-" + props._id} className={`p${isMy ? "s" : "e"}-4 pb-3 my-4 m${isMy ? "s" : "e"}-4 message ${!props.isViewed ? "unread" : ""} rounded-6 rounded-${isMy ? "end" : "start"}-0 ${isMy ? "my" : ""}`}>
            <div className="d-flex justify-content-between p-2">
                <div className="ms-2 d-flex align-items-baseline">
                    <p role="button" onClick={() => props.author?._id && props.openProfileViewer(props.author?._id)} className="text-btn fs-4 m-0 text-dark">{props.author?.username || "Deleted user"}</p>
                    <span className="ms-3">{formattedDate}</span>
                </div>
                <div className="d-flex align-items-center">
                    {
                        props.views || props.views === 0 ?
                            <div>
                                <span className="views">{props.views}</span>
                                <img className="ms-1" style={{ verticalAlign: "sub" }} width="20" src="/images/eye.png" alt="message-views" />
                            </div> : null
                    }
                    {
                        isMy ?
                            <div className="dropdown">
                                <button className="border-0 bg-transparent" data-bs-toggle="dropdown"><img width="20" src="/images/dots.png" alt="options" /></button>
                                <ul className="dropdown-menu">
                                    <li>
                                        <button onClick={() => props.deleteMessage(props._id, props.setWantToDelete)} className="dropdown-item text-center">Supprimer</button>
                                    </li>
                                </ul>
                            </div>
                            : null
                    }
                </div>
            </div>

            <div className="ms-3 me-4 d-grid" style={{ gridTemplateColumns: "50px 1fr" }}>
                <img className="rounded-circle object-fit-cover" width="50" height="50" alt="message-avatar" src={isSystem ? "/images/system.png" : `/profile/${props.author?._id || "deleted"}/avatar`} />
                <p className="ms-3 fs-6 m-0 text-break align-self-center" dangerouslySetInnerHTML={isSystem ? { __html: content } : null}>
                    {!isSystem ? content : null}
                </p>
            </div>
        </div>
    );
}

export default memo(Message);