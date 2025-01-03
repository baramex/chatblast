import { CheckIcon } from "@heroicons/react/24/outline";
import Popup from "./Popup";

export default function SuccessPopup({ message, show, title, onClose = undefined }) {
    return <Popup Icon={CheckIcon} show={show !== undefined ? show : !!message} iconColor="stroke-green-600" bgColor="bg-green-100" title={title} message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "border-transparent", bgColor: "bg-green-600", textColor: "text-white", bgHover: "hover:bg-green-700", ringColor: "focus:ring-green-500" }]} />;
}