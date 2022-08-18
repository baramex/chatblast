import Popup from "./Popup";

export default function ConfirmPopup({ message, onClose = undefined, onConfirm = undefined }) {
    return <Popup message={message} type="confirm" onConfirm={onConfirm} onClose={onClose} />;
}