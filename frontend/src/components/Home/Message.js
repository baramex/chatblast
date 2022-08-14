import { createRef, memo, useEffect } from "react";
import useElementOnScreen from "../../lib/hooks/useElementOnScreen";

function Message(props) {
    const date = new Date(props.date);

    const isMy = props.author.id === sessionStorage.getItem("id");
    const isSystem = props.author.username === "SYSTEM";
    const formattedDate = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")} ${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

    const message = createRef();
    const isVisible = useElementOnScreen(message, true);

    useEffect(() => {
        if (props.scroll && message.current) {
            message.current.scrollIntoView({ behavior: props.behavior || "auto" });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isVisible && !props.isViewed) {
        props.viewed(props._id);
    }

    return (
        <div ref={message} id={"m-" + props._id} className={`pb-2 my-4 rounded-3 border border-secondary message ${isMy ? "bg-light" : ""} ${!props.isViewed ? "unread" : ""}`}>
            <div className="d-flex justify-content-between username-container">
                <div className="d-flex align-items-center border-dashed username">
                    <img className="mx-2" width="30" alt="message-avatar" src={isSystem ? "/images/system.png" : `/profile/${(isMy ? "@me" : props.author.id)}/avatar`} />
                    <p className="pe-3 ps-1 py-1 fs-6 m-auto fw-bold">{props.author.username}</p>
                </div>
                <div className="d-flex align-items-center me-2 icons" style={{ gap: 10 }}>
                    <span className="date">{formattedDate}</span>
                    <div>
                        <span className="views">{props.views}</span>
                        <img className="ms-1" style={{ verticalAlign: "sub" }} width="20" src="/images/eye.png" alt="message-views" />
                    </div>
                </div>
            </div>
            <div className="d-flex">
                <p className="my-4 mx-4 fs-6 text-break text" style={{ flexGrow: 1 }}>
                    {props.content}
                </p>
                {isMy ?
                    <div className="d-flex flex-column" style={{ gap: 5 }}>
                        <button className="border-0 bg-transparent">
                            <img width="20" src="/images/bin.png" alt="delete-message" />
                        </button>
                    </div>
                    : null}
            </div>
        </div>
    );
}

export default memo(Message);