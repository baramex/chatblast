import { CheckIcon } from "@heroicons/react/24/outline";
import Popup from "./Popup";

export default function SuccessPopup({ message, show, title, onClose = undefined }) {
    return <Popup Icon={CheckIcon} show={show !== undefined ? show : !!message} iconColor="text-green-600" bgColor="bg-green-100" title={title} message={message} onClose={onClose} buttons={[{ name: "Ok", borderColor: "border-transparent", bgColor: "bg-green-600", textColor: "text-white", bgHover: "bg-green-700" }]} />;
}