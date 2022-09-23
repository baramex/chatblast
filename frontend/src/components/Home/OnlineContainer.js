import { ArrowSmallDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";

export default function OnlineContaier({ online }) {
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
        <div className="p-2 online-menu bg-emerald-700">
            <button ref={button} className="toggle-online-menu bg-transparent border-0 hidden px-1.5 md:block">
                <ArrowSmallDownIcon className="text-white" width="40" />
            </button>
            <div className="flex flex-col gap-2 mt-3">
                {
                    online && online.map((item) =>
                        <div className="online flex items-center" key={item.id}>
                            <img width="50" height="50" className="rounded-full object-cover" style={{ border: "#2DBF8F solid 1px", aspectRatio: "1/1" }} src={`/profile/${item.id}/avatar`} alt="avatar" />
                            <p className="mb-0 text-white">{item.username}</p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}