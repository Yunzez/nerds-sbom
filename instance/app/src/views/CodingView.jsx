import { useState, useRef, useEffect } from "react";
import "./CodingView.css";
import CodeEditor from "../components/CodeEditor";

export default function CodingView(props) {
  const [suggestions, set_suggestions] = useState([]);
  const [iframeKey, setIframeKey] = useState(0); // Key to force iframe reload
  const iframeRef = useRef(null);
  const refreshIframe = () => {
    setIframeKey((prevKey) => prevKey + 1); // Increment key to reload iframe
  };
  const setClipboard = props.setClipboard;
  const clipboard = props.clipboard;
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentWindow.document;
        doc.addEventListener("copy", (e) => {
          const text =
            e.clipboardData?.getData("text/plain") ||
            doc.getSelection()?.toString() ||
            "";
          console.log("Copied text from DT:", text);
          setClipboard((clipboard) => {
            const updated = [...clipboard, text];
            return updated.length > 20 ? updated.slice(-20) : updated;
          });
          // Optionally store or forward it:
          // navigator.clipboard.writeText(text);
        });
      } catch (err) {
        console.warn("Unable to access iframe contents:", err);
      }
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [iframeKey]);

  return (
    <div className="codingView">
      <div style={{ height: "100vh", width: "100%", position: "relative" }}>
        <button
          onClick={refreshIframe}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
            padding: "8px 16px",
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
          }}
        >
          Refresh
        </button>
        {/* <iframe
          key={iframeKey}
          src="http://localhost:8080/dashboard"
          title="Dependency Track"
          style={{ height: "100%", width: "100%", border: "none" }}
        /> */}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src="/dt/dashboard"
          title="Dependency Track"
          style={{ height: "100%", width: "100%", border: "none" }}
        />
      </div>
      {/* <CodeEditor
        suggestions={props.suggestions}
        submit={props.submit}
        editorRef={props.editorRef}
        output={props.output}
        current={props.current}
        confirmed={props.confirmed}
        compile_code={props.compile_code}
        real_taskno={props.real_taskno}
      /> */}
    </div>
  );
}
