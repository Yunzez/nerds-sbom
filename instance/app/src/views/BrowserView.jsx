import { useRef, useEffect, useState } from "react";
import RFB from "@novnc/novnc";
import "./BrowserView.css";
import ControlButton from "../components/ControlButton";
import AudioPlugin from "../lib/novnc-audio";
import { DEV_MODE } from "../util";

/* Completely disables the VNC session to enable testing without backend */
const NO_VNC = false;

export default function BrowserView(props) {
  const rfbElement = useRef(null);
  const containerElement = useRef(null);
  const lastVmClipboardRef = useRef(null);
  const rfbObj = useRef(null);
  // Can be one of null, connecting, connected, disconnected, and failed
  const [rfbStatus, setRfbStatus] = useState(null);
  const [alerted, setAlerted] = useState(false); // Flag to show if we've alerted the user to this disconnection already
  const audioPlugin = useRef(null);
  //const SHOW_DEBUG = process.env.NODE_ENV === "development";
  const SHOW_DEBUG = DEV_MODE;
  const clipboard = props.clipboard;
  const setClipboard = props.setClipboard;
  const setLoading = props.setLoading;
  const loading = props.loading;
  console.log("browser in 2");

  // Fixed version with correct charCodeAt and safer character handling:



  useEffect(() => {
    const el = rfbElement.current;
    if (!el) return;

    el.tabIndex = 0; // focusable so it can receive key events

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let pendingPaste = null; // Store paste text until Ctrl is released

    // Type plain text into the guest: printable ASCII + newline/tab
    const typeAscii = async (rfb, text) => {
      if (!text) return;
      console.log("Starting typeAscii for:", text.substring(0, 50) + "...");

      // small safety: ensure canvas focus
      try { rfb.focus?.(); } catch { }
      await sleep(5);

      // pace it so the guest doesn't miss chars
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === "\n") {
          rfb.sendKey?.(undefined, "Enter", true);
          rfb.sendKey?.(undefined, "Enter", false);
        } else if (ch === "\t") {
          rfb.sendKey?.(undefined, "Tab", true);
          rfb.sendKey?.(undefined, "Tab", false);
        } else {
          const cp = ch.charCodeAt(0);
          // printable ASCII range
          if (cp >= 32 && cp <= 126) {
            // keysym == codepoint works for ASCII on noVNC
            rfb.sendKey?.(cp, undefined, true);
            rfb.sendKey?.(cp, undefined, false);
          }
        }
      }
      setLoading(false);
    };

    const onKeyDown = async (e) => {
      const rfb = rfbObj.current;
      if (!rfb) return;

      const isPaste = (e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "v";

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      e.returnValue = false;
      if (!isPaste) return;

      console.log("Ctrl+V detected - preventing default and storing paste text");
      // Get text to paste but DON'T paste it yet - store it for when Ctrl is released
      let txt = Array.isArray(clipboard) ? clipboard[0]
        : (typeof clipboard === "string" ? clipboard : "");
      if (!txt && navigator.clipboard?.readText) {
        try { txt = await navigator.clipboard.readText(); } catch { }
      }

      console.log("Storing text for paste when Ctrl released:", txt?.substring(0, 50) + "...");
      pendingPaste = txt; // Store the text, don't paste yet
    };


    const onKeyUp = async (e) => {
      // When Ctrl key is released, execute the pending paste
      if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
        console.log("Ctrl + V released - executing pending paste");
        const rfb = rfbObj.current;
        if (rfb) {
          setLoading(true);
          await typeAscii(rfb, pendingPaste);

          pendingPaste = null;
        }

      } else if (e.key === "c" && (e.ctrlKey || e.metaKey)) {
        console.log("Ctrl+C detected - copying to clipboard");
        const text = lastVmClipboardRef.current;
        setClipboard(prev => [text, ...prev]);
      }
    };
    console.log("assigning event listeners");
    // Listen for both keydown (to capture paste command) and keyup (to execute when Ctrl released)
    el.addEventListener("keydown", onKeyDown, true);
    el.addEventListener("keyup", onKeyUp, true);
    // el.addEventListener("paste", handlePaste, true);
    return () => {
      el.removeEventListener("keydown", onKeyDown, true);
      el.removeEventListener("keyup", onKeyUp, true);
      // el.removeEventListener("paste", handlePaste, true);
    };
  }, [rfbElement, rfbObj, clipboard]);



  function debug(msg) {
    if (SHOW_DEBUG) {
      console.debug(msg);
    }
  }

  // Initialize audio plugin if needed
  if (!audioPlugin.current) {
    audioPlugin.current = new AudioPlugin();
    audioPlugin.current.initUi();
  }

  function startAudio() {
    if (audioPlugin.current) {
      debug("Starting audio stream");
      audioPlugin.current.startAudio()
    }
  }

  function stopAudio() {
    if (audioPlugin.current) {
      debug("Stopping audio stream");
      audioPlugin.current.stopAudio()
      audioPlugin.current.removeUi();
    }
  }

  function connect(quiet) {
    if (rfbStatus != "connected" || rfbStatus != "connecting") {
      setRfbStatus("connecting");

      let vncURL = `wss://${window.location.host}${window.location.pathname}?token=vnc`;
      if (DEV_MODE) {
        vncURL = `ws://192.168.1.35:82?token=vnc`;
      }
      let rfb = new RFB(rfbElement.current, vncURL);
      //rfb.scaleViewport = true;
      rfb.resizeSession = true;
      rfb.background = "#494949";
      rfb.addEventListener("connect", handleConnect);
      rfb.addEventListener("disconnect", handleDisconnect);
      rfb.addEventListener("clipboard", handleClipboard);
      rfbObj.current = rfb;
    }

  }

  const handleDisconnect = (stat) => {
    debug("Handled disconnect");
    stopAudio();
    if (!stat.detail.clean) {
      debug("Unclean disconnect");
      setRfbStatus("failed");
    } else {
      debug("Clean disconnect");
      setRfbStatus("disconnected");
    }
  }

  function handleConnect() {
    debug("Connected to browser instance");
    setRfbStatus("connected");
    setAlerted(false);
    startAudio();
  }

  const handleClipboard = (stat) => {
    debug("Got clipboard event");
    debug(stat.detail);
    console.log("Clipboard text:", stat.detail?.text?.substring(0, 50) + "...");
    if (stat.detail && navigator.clipboard) {
      lastVmClipboardRef.current = stat.detail.text;
      navigator.clipboard.writeText(stat.detail.text);
    }
  }

  // Setup this component with a new VNC connection
  useEffect(() => {
    if (!NO_VNC) {
      connect();
      return () => {
        if (rfbObj.current) { rfbObj.current.disconnect() }
        debug("disconnected RFB object on unmount");
      };
    }
  }, []);

  // Dependencies: containerElement, rfbElement
  function doResize() {
    if (containerElement.current) {
      const width = Math.round(containerElement.current.offsetWidth);
      if (width != 0) {
        debug(`Setting width to ${width}px`);
        rfbElement.current.style.width = `${width}px`;
      }
    }
  }


  useEffect(() => {
    if (props.currentTab == "browser" && containerElement.current) {
      doResize();
    }
  }, [props.currentTab, containerElement, rfbElement]);

  useEffect(() => {
    const observer = new ResizeObserver(doResize);
    if (containerElement.current) {
      observer.observe(containerElement.current);

      return (() => {
        if (containerElement.current) {
          observer.unobserve(containerElement.current);
        }
      })
    }
  }, [containerElement, rfbElement]);

  // Setup online listener
  useEffect(() => {
    window.addEventListener("online", connect);
    return (() => {
      window.removeEventListener("online", connect);
    });
  });

  // Setup paste listener
  /* Disabled for now as it does not capture paste events when the noVNC window is focused
  useEffect(() => {
    function handlePaste(e) {
      e.preventDefault();

      debug("got paste");
      if (rfbObj.current) {
        const paste = e.clipboardData.getData("text/plain");
        debug(`got paste data: ${paste}`);
   )     rfbObj.current.clipboardPasteFrom(paste);
      }
    }

    rfbElement.current.addEventListener("paste", handlePaste, true);
    return (() => rfbElement.current.removeEventListener("paste", handlePaste, true))
  });*/

  useEffect(() => {
    debug(`New RFB state: ${rfbStatus}`);
    props.setConnStatus(rfbStatus === "connected");

    // Try and reconnect
    // We have to do this because the RFB connection will timeout
    // when there is no activity
    if (rfbStatus === "disconnected") {
      debug("Trying to reconnect to RFB");
      var reconnectTimeout;
      connect();
      /*
      reconnectTimeout = setTimeout(() => {
        setRfbStatus(currStatus => {
          if (currStatus == "connecting" || currStatus == "disconnected") {
            debug("Failed to reconnect");
            return "failed";
          }
          return currStatus
        })
      }, 10000);*/
    } else if (rfbStatus === "failed" && !alerted) {
      setAlerted(true);
      alert("You have been disconnected from the study infrastructure. Please "
        + "check your internet connection and reconnect. If you believe this "
        + "is an error, please contact the study administrators.");
    }

  }, [rfbStatus, alerted]);

  let reconButton = (<ControlButton disabled={true} title="Reconnect" />);
  if (rfbStatus == "disconnected") {
    reconButton = (<ControlButton onClick={connect} title="Reconnect" />);
  }

  return (
    <div className="browserContainer" ref={containerElement}>
      <div className="viewContainer" ref={rfbElement}>
      </div>
    </div>
  );
}
