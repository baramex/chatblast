import Popup from "./Popup";

export default function ConfirmPopup({ message, onClose = undefined, onConfirm = undefined, canClose = true }) {
    return <Popup message={message} type="confirm" onConfirm={onConfirm} onClose={onClose} canClose={canClose} />;
}