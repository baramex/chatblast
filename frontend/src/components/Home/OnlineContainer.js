export default function OnlineContaier(props) {
    return (<div className="bg-light position-fixed top-0 left-0 translate-start slide-menu-container rounded-br-3"
        style={{ zIndex: 20, filter: "drop-shadow(3px 3px 10px rgba(0,0,0,.5))" }}>
        <button ref={openOnline}
            className="activer w-100 bg-light py-2 px-3 text-center d-flex justify-content-center align-items-center translate-end rounded-br-3 border-0">
            <div className="online-circle rounded-circle me-3"></div>
            <span id="online-count">{(props.onlineCount || props.onlineCount === 0) ? props.onlineCount : "--"} en ligne</span>
        </button>
        <div id="online-container">
            <table className="w-100 table table-striped m-0">
                <tbody>
                    {
                        props.online && props.online.map((online) =>
                            <tr key={online.id}>
                                <td className="py-3 px-4 d-flex gap-2" style={{ maxWidth: 300, minWidth: 180 }}>
                                    <img width="40" src={`/profile/${online.id === sessionStorage.getItem("id") ? "@me" : online.id}/avatar`} alt="online-avatar" />
                                    <span className="fs-6 my-auto" style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{online.username}</span>
                                </td>
                            </tr>
                        )
                    }
                </tbody>
            </table>
        </div>
    </div>);
}

function openOnline(ref) {
    if (!ref) return;
    ref.addEventListener("click", () => {
        ref.parentElement.classList.toggle("active");
    });
}