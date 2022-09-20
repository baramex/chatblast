import Popup from "./Popup";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function ConfirmPopup({ message, title, onClose = undefined, onConfirm = undefined }) {
    return <Popup Icon={ExclamationTriangleIcon} iconColor="text-orange-600" bgColor="bg-orange-100" title={title} message={message} onClose={onClose} buttons={[{ name: "Confirmer", borderColor: "border-transparent", bgColor: "bg-green-600", textColor: "text-white", bgHover: "bg-green-700", ringColor: "ring-red-500", onClick: onConfirm }, { name: "Annuler" }]} />;
}