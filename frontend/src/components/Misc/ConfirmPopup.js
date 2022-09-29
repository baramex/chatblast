import Popup from "./Popup";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ConfirmPopup({ message, show, title, onClose = undefined, onConfirm = undefined }) {
    return <Popup Icon={ExclamationTriangleIcon} show={show !== undefined ? show : !!message} iconColor="stroke-orange-600" bgColor="bg-orange-100" title={title} message={message} onClose={onClose} buttons={[{ name: "Confirmer", borderColor: "border-transparent", bgColor: "bg-orange-500", textColor: "text-white", bgHover: "hover:bg-orange-600", ringColor: "focus:ring-orange-400", onClick: onConfirm }, { name: "Annuler" }]} />;
}