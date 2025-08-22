import { useState, useRef } from "react";
import "./CodingView.css";
import CodeEditor from "../components/CodeEditor";

export default function CodingView(props) {
  const [suggestions, set_suggestions] = useState([]);
  const [iframeKey, setIframeKey] = useState(0); // Key to force iframe reload

  const refreshIframe = () => {
    setIframeKey((prevKey) => prevKey + 1); // Increment key to reload iframe
  };

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
        <iframe
          key={iframeKey}
          src="http://localhost:8080/dashboard"
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
