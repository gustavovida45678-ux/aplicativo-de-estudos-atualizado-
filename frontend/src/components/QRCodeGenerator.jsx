import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";

export function QRCodeGenerator({
  value,
  width = 512,
  height = 512,
  errorCorrectionLevel = "H",
  mode = "text", // "text" or "url"
  style = {}
}) {
  const [qrImage, setQrImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value) return;

    setIsGenerating(true);
    setError(null);

    const generateQR = async () => {
      try {
        const canvas = await QRCode.toCanvas(canvasRef.current, {
          text: value,
          width: width,
          height: height,
          errorCorrectionLevel: errorCorrectionLevel,
          margin: 4, // Increased margin for better scanning
        });
        setQrImage(canvas);
      } catch (err) {
        console.error("QR Code generation error:", err);
        setError("Erro ao gerar QR Code");
      } finally {
        setIsGenerating(false);
      }
    };

    generateQR();

    return () => {
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [value, width, height, errorCorrectionLevel]);

  if (isGenerating) {
    return (
      <div className="qr-loading">
        <span>Gerando QR Code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!qrImage) {
    return null;
  }

  return (
    <div className="qr-code-container" style={{ width: width, height: height }}>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <img
        src={qrImage}
        alt="QR Code"
        style={{
          width: width,
          height: height,
          imageRendering: "pixelated",
          border: "1px solid #e2e8f0",
          borderRadius: 4,
          backgroundColor: "#fff",
        }}
      />
      <div className="qr-action-bar">
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="qr-copy-btn"
          title="Copiar texto"
          aria-label="Copiar texto para área de transferência"
        >
          📋
        </button>
        <span>
          {value.length > 50 ? value.substring(0, 50) + "..." : value}
        </span>
      </div>
    </div>
  );
}

export function useQRCode(value, options = {}) {
  const [qrImage, setQrImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!value) return;

    setIsGenerating(true);

    QRCode.toDataURL(value, {
      width: options.width || 512,
      height: options.height || 512,
      errorCorrectionLevel: options.errorCorrectionLevel || "H", // High error correction
    })
      .then((dataUrl) => {
        setQrImage(dataUrl);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error("QR Code error:", err);
        setIsGenerating(false);
      });
  }, [value, options]);

  return { qrImage, isGenerating };
}