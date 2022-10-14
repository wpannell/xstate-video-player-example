import "./styles.css";
import React, { useRef } from "react";
import ReactDOM from "react-dom";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";

// inspect({
//   url: "https://stately.ai/viz?inspect",
//   iframe: false
// });

const machine = createMachine({
  id: "Video",
  initial: "mini",
  states: {
    mini: {
      description: "The video as a small thumbnail",
      on: {
        toggle: {
          target: "full",
          description: "User clicks video"
        }
      }
    },
    full: {
      entry: "playVideo",
      exit: "pauseVideo",
      invoke: [
        {
          src: "video.ended"
        },
        {
          src: "key.escape"
        }
      ],
      initial: "playing",
      description: "Video playing fullscreen",
      states: {
        playing: {
          on: {
            "video.ended": {
              target: "stopped"
            }
          }
        },
        stopped: {
          after: {
            "1000": {
              target: "#Video.mini",
              actions: []
            }
          }
        }
      },
      on: {
        toggle: {
          target: "mini",
          description: "User clicks video"
        },
        "key.escape": {
          target: "mini"
        }
      }
    }
  }
});

function invokeVideoEnded(videoRef) {
  return () => (sendBack) => {
    const handler = () => {
      sendBack("video.ended");
    };
    videoRef.current.addEventListener("ended", handler);
    return () => {
      videoRef.current.removeEventListener("ended", handler);
    };
  };
}

function invokeKeyEscape() {
  return () => (sendBack) => {
    const handler = (event) => {
      if (event.key === "Escape") {
        sendBack("key.escape");
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  };
}

function App() {
  const videoRef = useRef();
  const [state, send] = useMachine(machine, {
    devTools: true,
    actions: {
      playVideo: () => {
        videoRef.current.play();
      },
      pauseVideo: () => {
        videoRef.current.pause();
      }
    },
    services: {
      "video.ended": invokeVideoEnded(videoRef),
      "key.escape": invokeKeyEscape()
    }
  });

  return (
    <div className="App">
      <h2>This is a cool video</h2>
      <div
        id="player"
        onClick={() => {
          send("toggle");
        }}
        data-state={state.toStrings().join(" ")}
      >
        <video id="video" controls width="250" ref={videoRef}>
          <source
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm"
            type="video/webm"
          />
          <source
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
            type="video/mp4"
          />
          Sorry, your browser doesn't support embedded videos.
        </video>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
