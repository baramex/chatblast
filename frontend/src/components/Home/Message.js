import { createRef, memo, useEffect } from "react";

function Message(props) {
    const date = new Date(props.date);

    const isSystem = props.author.username === "SYSTEM";
    const isMy = !isSystem && props.author.id === sessionStorage.getItem("id");
    const formattedDate = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    let content = props.content;

    const message = createRef();

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
        let element = message.current;
        if (!element) return;
        if (!props.isViewed) props.observer.observe(element);

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

        return () => {
            props.observer.unobserve(element);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={message} id={"m-" + props._id} className={`pb-2 my-4 message ${!props.isViewed ? "unread" : ""}`}>
            <div className="d-flex justify-content-between p-2">
                <div className="d-flex align-items-baseline">
                    <p className="fs-4 m-0 text-black">{props.author.username}</p>
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
                                        <button onClick={() => props.deleteMessage(props._id)} className="dropdown-item text-center">Supprimer</button>
                                    </li>
                                </ul>
                            </div>
                            : null
                    }
                </div>
            </div>

            <div className="d-flex">
                <img className="ms-3 rounded-circle" width="50" height="50" alt="message-avatar" src={isSystem ? "/images/system.png" : `/profile/${(isMy ? "@me" : props.author.id)}/avatar`} />
                <p className="mx-2  mt-2 fs-6 text-break text" style={{ flexGrow: 1 }} dangerouslySetInnerHTML={isSystem ? { __html: content } : null}>
                    {!isSystem ? content : null}
                </p>
            </div>
        </div>
    );
}

/*
<div className="d-flex justify-content-between username-container">
                <div className="d-flex align-items-center border-dashed username">
                    <img className="mx-2 my-1" width="30" alt="message-avatar" src={isSystem ? "/images/system.png" : `/profile/${(isMy ? "@me" : props.author.id)}/avatar`} />
                    <p className="pe-3 ps-1 py-1 fs-6 m-auto fw-bold">{props.author.username}</p>
                </div>
                <div className="d-flex align-items-center me-2 icons" style={{ gap: 10 }}>
                    <span className="date">{formattedDate}</span>
                    {
                        props.views || props.views === 0 ?
                            <div>
                                <span className="views">{props.views}</span>
                                <img className="ms-1" style={{ verticalAlign: "sub" }} width="20" src="/images/eye.png" alt="message-views" />
                            </div> : null
                    }
                </div>
            </div>
            <div className="d-flex">
                <p className="my-4 mx-4 fs-6 text-break text" style={{ flexGrow: 1 }} dangerouslySetInnerHTML={isSystem ? { __html: content } : null}>
                    {!isSystem ? content : null}
                </p>
                {isMy ?
                    <div className="d-flex flex-column me-2" style={{ gap: 5 }}>
                        <button onClick={() => props.deleteMessage(props._id)} className="border-0 bg-transparent p-0">
                            <img width="20" src="/images/bin.png" alt="delete-message" />
                        </button>
                    </div>
                    : null}
            </div>
            */

export default memo(Message);