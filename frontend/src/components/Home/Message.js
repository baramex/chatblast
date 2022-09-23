import { EllipsisVerticalIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import { createRef, memo, useEffect } from "react";
import useElementOnScreen from "../../lib/hooks/useElementOnScreen";
import Dropmenu from "../Misc/Dropmenu";

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
        <div ref={message} id={"m-" + props._id} className={`pb-4 my-6 text-neutral-900 ${isMy ? "pl-5 ml-6 rounded-l-[70px] bg-emerald-200" : "pr-5 mr-6 rounded-r-[70px] bg-[rgb(206,200,200)]"} ${!props.isViewed ? "bg-[#e3c2c2]" : ""}`}>
            <div className="flex justify-between p-2">
                <div className="ml-2 flex items-baseline">
                    <p role="button" onClick={() => props.author?._id && props.openProfileViewer(props.author?._id)} className="hover:underline text-xl m-0">{props.author?.username || "Deleted user"}</p>
                    <span className="ml-3">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    {
                        props.views || props.views === 0 ?
                            <div>
                                <span>{props.views}</span>
                                <EyeIcon className="ml-1 inline align-sub" width="20" />
                            </div> : null
                    }
                    {
                        isMy ?
                            <Dropmenu className="h-[20px]" items={[{ text: "supprimer", textColor: "text-red-500", hoverTextColor: "hover:text-red-600", Icon: TrashIcon, onClick: () => props.deleteMessage(props._id, props.setWantToDelete) }]}>
                                <EllipsisVerticalIcon width="20" />
                            </Dropmenu>
                            : null
                    }
                </div>
            </div>

            <div className="ml-3 mr-4 grid grid-cols-[50px_1fr]">
                <img className="rounded-full object-cover" width="50" height="50" alt="message-avatar" src={isSystem ? "/images/system.png" : `/profile/${props.author?._id || "deleted"}/avatar`} />
                <p className="ml-3 m-0 break-words self-center" dangerouslySetInnerHTML={isSystem ? { __html: content } : null}>
                    {!isSystem ? content : null}
                </p>
            </div>
        </div>
    );
}

export default memo(Message);