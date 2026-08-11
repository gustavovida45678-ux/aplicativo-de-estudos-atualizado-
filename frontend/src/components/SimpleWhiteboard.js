import { useRef, useEffect, useState } from "react";
import { PenTool, Eraser, Trash2, Download, RotateCcw, X, Minus, Plus, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function SimpleWhiteboard({ onExit }) {
  const { toast } = useToast();
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPointRef = useRef(null);

  const COLORS = ["#ffffff", "#58a6ff", "#f78166", "#3fb950", "#d2a8ff", "#ffa657", "#ff7b72", "#79c0ff"];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      const rect = wrapperRef.current.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = wrapperRef.current.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pt = getPoint(e);
    lastPointRef.current = pt;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pt = getPoint(e);
    
    ctx.strokeStyle = tool === "eraser" ? "#0d1117" : color;
    ctx.lineWidth = tool === "eraser" ? size * 3 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    
    lastPointRef.current = pt;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.min(Math.max(prev * factor, 0.25), 4));
    } else {
      setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const clearCanvas = () => {
    redraw();
    toast({ title: "Lousa limpa" });
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "lousa-digital.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast({ title: "Imagem salva" });
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="simple-whiteboard" ref={wrapperRef} onWheel={handleWheel}>
      {onExit && (
        <div className="whiteboard-header">
          <button className="exit-btn" onClick={onExit} title="Sair">
            <X size={20} />
          </button>
          <div className="whiteboard-title">Lousa Digital</div>
        </div>
      )}

      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button className={tool === "pen" ? "active" : ""} onClick={() => setTool("pen")} title="Caneta (P)">
            <PenTool size={20} />
          </button>
          <button className={tool === "eraser" ? "active" : ""} onClick={() => setTool("eraser")} title="Borracha (E)">
            <Eraser size={20} />
          </button>
        </div>

        <div className="tool-divider" />

        <div className="tool-group">
          <span className="tool-label">Cor</span>
          <div className="color-palette">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-swatch ${color === c ? "active" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="color-picker" />
          </div>
        </div>

        <div className="tool-group">
          <span className="tool-label">Espessura</span>
          <input type="range" min="1" max="20" value={size} onChange={e => setSize(Number(e.target.value))} />
          <span className="size-value">{size}px</span>
        </div>

        <div className="tool-divider" />

        <div className="tool-group actions">
          <button onClick={clearCanvas} title="Limpar tudo"><Trash2 size={20} /></button>
          <button onClick={saveImage} title="Baixar PNG"><Download size={20} /></button>
          <button onClick={resetView} title="Resetar zoom (0)"><RotateCcw size={20} /></button>
          <div className="zoom-display">
            <Minus size={16} onClick={() => setScale(s => Math.max(s * 0.8, 0.25))} />
            <span>{Math.round(scale * 100)}%</span>
            <Plus size={16} onClick={() => setScale(s => Math.min(s * 1.25, 4))} />
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="whiteboard-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

export default SimpleWhiteboard;