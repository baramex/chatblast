import Popup from "./Popup";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

export default function ConfirmPopup({ message, title, onClose = undefined, onConfirm = undefined }) {
    return <Popup Icon={ExclamationTriangleIcon} title={title} message={message} onClose={onClose} buttons={[{ name: "Confirmer", borderColor: "transparent", bgColor: "green-600", textColor: "white", bgHover: "green-700", ringColor: "green-500", onClick: onConfirm }, { name: "Annuler" }]} />;
}