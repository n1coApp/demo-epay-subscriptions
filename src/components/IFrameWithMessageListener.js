import React, { useEffect } from "react";

const IFrameWithMessageListener = ({ url, handleMessage }) => {
  useEffect(() => {
    const handleIframeMessage = (event) => {
      // It's crucial to check the origin for security reasons
      try {
        const trustedOrigin = new URL(url).origin;
        if (event.origin === trustedOrigin) {
          const dataMessage = JSON.parse(event.data);
          if (dataMessage.MessageType && dataMessage.Status) {
            handleMessage(dataMessage);
          }
        } else {
          console.warn("Message received from untrusted origin:", event.origin);
        }
      } catch (error) {
        console.error("Error parsing iframe message or origin URL:", error);
      }
    };

    window.addEventListener("message", handleIframeMessage);

    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [url, handleMessage]);

  return (
    <div
      style={{
        border: "1px solid #333",
        padding: "20px",
        marginTop: "20px",
        backgroundColor: "#0a0a0a",
        borderRadius: "8px",
      }}
    >
      <iframe
        id="n1co3dsIframe"
        title="N1co 3DS Authentication"
        src={url}
        style={{ 
          width: "100%", 
          height: "400px", 
          border: "1px solid #333",
          borderRadius: "4px",
          backgroundColor: "#1a1a1a"
        }}
      />
    </div>
  );
};

export default IFrameWithMessageListener;
