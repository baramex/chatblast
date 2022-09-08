import Popup from "./Popup";

export default function ConfirmPopup({ message, onClose = undefined, onConfirm = undefined, type, canClose = true }) {
    return <Popup message={message} type={type} onConfirm={onConfirm} onClose={onClose} canClose={canClose} />;
}