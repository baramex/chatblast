import { ArrowSmallDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";

export default function OnlineContaier({ online, openProfileViewer, avatar }) {
    const button = useRef();

    useEffect(() => {
        if (!button.current) return;

        const currentButton = button.current;

        const buttonCallback = () => {
            currentButton.parentElement.classList.toggle("active");
        };

        currentButton.addEventListener("click", buttonCallback);

        return () => {
            currentButton.removeEventListener("click", buttonCallback);
        };
    }, [button]);

    return (
        <div className="py-2 online-menu bg-emerald-700 hidden md:block">
            <button ref={button} className="mx-2 toggle-online-menu bg-transparent border-0 outline-none px-1.5">
                <ArrowSmallDownIcon className="stroke-white" width="40" />
            </button>
            <table className="gap-1 mt-3 w-full">
                <tbody>
                    {
                        online && online.map((item) =>
                            <tr key={item.id}>
                                <td onClick={() => openProfileViewer(item.id)} role="button" className="online border-0 py-1 px-2 flex items-center w-full hover:bg-white/25">
                                    <img width="50" height="50" className="rounded-full object-cover" style={{ border: "#2DBF8F solid 1px", aspectRatio: "1/1" }} src={item.id === sessionStorage.getItem("id") ? avatar || "/images/user.png" : `/profile/${item.id}/avatar`} alt="avatar" />
                                    <p className="mb-0 text-left text-white">{item.username}</p>
                                </td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    );
}