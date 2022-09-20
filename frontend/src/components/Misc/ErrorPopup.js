import Popup from "./Popup";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ErrorPopup({ message, title, onClose = undefined }) {
    return <Popup Icon={ExclamationTriangleIcon} title={title} message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "border-transparent", bgColor: "bg-red-600", textColor: "text-white", bgHover: "bg-red-700" }]} />;
}