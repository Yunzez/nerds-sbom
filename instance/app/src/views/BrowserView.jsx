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
  const rfbObj = useRef(null);
  // Can be one of null, connecting, connected, disconnected, and failed
  const [rfbStatus, setRfbStatus] = useState(null);
  const [alerted, setAlerted] = useState(false); // Flag to show if we've alerted the user to this disconnection already
  const audioPlugin = useRef(null);
  //const SHOW_DEBUG = process.env.NODE_ENV === "development";
  const SHOW_DEBUG = DEV_MODE;
  const vncHasFocus = useRef(false);
  const clipboard = props.clipboard;
  const setClipboard = props.setClipboard;
  console.log("browser in");

 // Debug version to see what's happening:

// Basic event testing to see what's working:

useEffect(() => {
  const el = rfbElement.current;
  if (!el) {
    console.log("No rfbElement found");
    return;
  }

  console.log("Setting up event listeners on:", el);

  function onKeyDown(e) {

    const metaPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";
    if (metaPaste) {
      console.log("Ctrl+V detected!");
      
      // Don't prevent default yet, just log
      const rfb = rfbObj.current;
      if (!rfb) {
        console.log("No RFB object");
        return;
      }

      // Get text to paste
      let txt = Array.isArray(clipboard)
        ? clipboard[0]
        : typeof clipboard === "string" ? clipboard : "";

      console.log("Text to paste:", txt?.substring(0, 50));

      if (txt && rfbObj.current) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Attempting to send text...");
        
        // Simple test - just send first 3 characters
        rfb.focus?.();
        
        setTimeout(() => {
          for (let i = 0, len = txt.length; i < len; i++) {
            setTimeout(() => {
              const char = txt[i];
              console.log(`Sending char ${i}: '${char}' (${char.charCodeAt(i)})`);
              rfb.sendKey(txt.charCodeAt(i)); // Single parameter like your example
            }, i * 5); // 5ms delay between each character
          }
        }, 100);
      }
    }
  }

  // Make element focusable
  el.tabIndex = 0;
  
  // Add all event listeners
  el.addEventListener("keydown", onKeyDown, true);
  
  console.log("Event listeners added");
  
  return () => {
    console.log("Cleaning up event listeners");
    el.removeEventListener("keydown", onKeyDown, true);
  };
}, [clipboard, rfbElement, vncHasFocus]);
  
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
    if (stat.detail && navigator.clipboard) {
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
