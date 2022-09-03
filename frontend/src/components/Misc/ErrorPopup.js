import Popup from "./Popup";

export default function ErrorPopup({ message, onClose = undefined, canClose = true }) {
    return <Popup message={message} type="error" onClose={onClose} canClose={canClose} />;
}