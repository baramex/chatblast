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
        <div className="p-2 online-menu" style={{ backgroundColor: "#13875E" }}>
            <button ref={button} className="toggle-online-menu bg-transparent border-0">
                <img width="40" src="/images/arrow.png" alt="arrow-extend-reduce" />
            </button>
            <div className="d-flex flex-column gap-2 mt-3">
                {
                    online && online.map((item) =>
                        <div className="online d-flex align-items-center" key={item.id}>
                            <img width="50" height="50" className="rounded-circle object-fit-cover" style={{ border: "#2DBF8F solid 1px", aspectRatio: "1/1" }} src={`/profile/${item.id}/avatar`} alt="avatar" />
                            <p className="mb-0 text-white">{item.username}</p>
                        </div>
                    )
                }
            </div>
        </div>
    );
}