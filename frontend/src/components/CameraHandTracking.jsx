import { useState, useEffect, useRef, useCallback } from "react";
import { Video, Monitor, Hand, Zap, X, CheckCircle, AlertCircle, RotateCcw, Loader2 } from "lucide-react";

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17], [0, 5]
];

export function CameraHandTracking({
  isActive,
  onGesture,
  onStatusChange,
  videoRef
}) {
  const [hands, setHands] = useState(null);
  const [camera, setCamera] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const animationRef = useRef(null);
  const lastGestureRef = useRef("none");
  const gestureCooldownRef = useRef(0);

  useEffect(() => {
    if (!isActive) {
      cleanup();
      return;
    }

    initMediaPipe();
  }, [isActive]);

  const initMediaPipe = async () => {
    try {
      setError(null);
      
      const Hands = await import("@mediapipe/hands");
      const CameraUtils = await import("@mediapipe/camera_utils");
      const DrawingUtils = await import("@mediapipe/drawing_utils");

      const handsInstance = new Hands.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
      });

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handsInstance.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          const gesture = detectGesture(landmarks);

          const now = Date.now();
          if (gesture !== lastGestureRef.current) {
            lastGestureRef.current = gesture;
            onStatusChange?.("gesture", `Gesto: ${gesture}`);
          }

          if (now - gestureCooldownRef.current > 50) {
            gestureCooldownRef.current = now;
            onGesture?.(gesture, landmarks);
          }

          onStatusChange?.("detected", "Mão detectada");
        } else {
          lastGestureRef.current = "none";
          onStatusChange?.("none", "Mão não detectada");
        }
      });

      setHands(handsInstance);

      const waitForVideo = (retries = 30) =>
        new Promise((resolve) => {
          const check = () => {
            const el = videoRef?.current;
            if (el) return resolve(el);
            if (retries <= 0) return resolve(null);
            setTimeout(() => check(retries - 1), 100);
          };
          check();
        });

      const videoElement = await waitForVideo();
      if (videoElement) {
        const cameraInstance = new CameraUtils.Camera(videoElement, {
          onFrame: async () => {
            if (handsInstance && isActive) {
              await handsInstance.send({ image: videoElement });
            }
          },
          width: 640,
          height: 480
        });

        setCamera(cameraInstance);
        await cameraInstance.start();
        setIsInitialized(true);
        onStatusChange?.("active", "Câmera ativa");
      } else {
        throw new Error("Elemento de vídeo não encontrado");
      }
    } catch (err) {
      console.error("Erro ao inicializar MediaPipe:", err);
      setError(err.message);
      onStatusChange?.("error", "Erro na câmera");
    }
  };

  const detectGesture = (landmarks) => {
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const indexTip = landmarks[8];
    const indexPip = landmarks[6];
    const middleTip = landmarks[12];
    const middlePip = landmarks[10];
    const ringTip = landmarks[16];
    const ringPip = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyPip = landmarks[18];

    const indexExtended = indexTip.y < indexPip.y;
    const middleExtended = middleTip.y < middlePip.y;
    const ringExtended = ringTip.y < ringPip.y;
    const pinkyExtended = pinkyTip.y < pinkyPip.y;

    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    // O DEDO É O PINCEL: qualquer mão em quadro escreve.
    // - punho fechado = borracha
    // - pinça (polegar + indicador juntos) = escrever fino
    // - qualquer outra posição com a mão presente = escrever
    if (extendedCount === 0 && pinchDist > 0.08) {
      return "fist";
    }

    if (pinchDist < 0.05) {
      return "pinch";
    }

    return "point";
  };

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (camera) {
      camera.stop();
      setCamera(null);
    }
    setHands(null);
    setIsInitialized(false);
    lastGestureRef.current = "none";
  }, [camera]);

  const stopCamera = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return (
    <div className="camera-hand-tracking">
      {error && (
        <div className="camera-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={initMediaPipe}>
            <RotateCcw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {!isInitialized && isActive && (
        <div className="camera-loading">
          <Loader2 className="spinning" size={32} />
          <p>Iniciando câmera...</p>
        </div>
      )}
    </div>
  );
}

export function GestureGuide() {
  const gestures = [
    { name: "Apontar", icon: "point", description: "Desenhar/Escrever com o dedo indicador", color: "#00d9ff" },
    { name: "Pinça", icon: "pinch", description: "Desenhar preciso (polegar + indicador)", color: "#10b981" },
    { name: "Punho", icon: "fist", description: "Ativar borracha", color: "#ef4444" },
    { name: "Mão Aberta", icon: "open", description: "Mover/Selecionar (futuro)", color: "#f59e0b" },
  ];

  return (
    <div className="gesture-guide">
      <h4>
        <Zap size={16} /> Gestos da Câmera
      </h4>
      {gestures.map((g) => (
        <div key={g.icon} className="gesture-item">
          <div className="gesture-icon" style={{ backgroundColor: g.color + "20" }}>
            <span style={{ color: g.color }}>
              {g.icon === "point" && "☝️"}
              {g.icon === "pinch" && "🤏"}
              {g.icon === "fist" && "✊"}
              {g.icon === "open" && "✋"}
            </span>
          </div>
          <div>
            <strong>{g.name}</strong>
            <span>{g.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}