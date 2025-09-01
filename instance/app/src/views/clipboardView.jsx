import "./clipboardView.css";
export default function ClipboardView(props) {
    const { clipboard, setClipboard } = props;

    return (
        <div>
            <div className="clipboard-header">Clipboard History</div>
            <div className="clipboard-container">
                {clipboard.map((item, index) => (
                    <div key={index} className="clipboard-item">{item}</div>
                ))}
            </div>
        </div>
    );
}