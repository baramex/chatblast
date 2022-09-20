import Popup from "./Popup";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ErrorPopup({ message, title, show, onClose = undefined }) {
    return <Popup Icon={ExclamationTriangleIcon} show={show !== undefined ? show : !!message} title={title} message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "border-transparent", bgColor: "bg-red-600", textColor: "text-white", bgHover: "hover:bg-red-700", ringColor: "focus:ring-red-500" }]} />;
}