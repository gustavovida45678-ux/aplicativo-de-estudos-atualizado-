import { useMemo, useState } from 'react';
import { X, Download, Brain, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const W = 900;
const H = 620;
const CX = W / 2;
const CY = H / 2;

const NODE_R = 52;
const BRANCH_ROOT_DIST = 150;
const CHILD_STEP = 95;

const MindMapSVG = ({ title, icon, branches }) => {
  const layout = useMemo(() => {
    const n = branches.length;
    const nodes = [];
    const links = [];

    nodes.push({ id: 'root', label: title, icon, x: CX, y: CY, r: NODE_R + 8, isRoot: true });

    branches.forEach((branch, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      const bx = CX + dx * BRANCH_ROOT_DIST;
      const by = CY + dy * BRANCH_ROOT_DIST;
      nodes.push({ id: `b${i}`, label: branch.label, icon: branch.icon, x: bx, y: by, r: NODE_R, branch: true });
      links.push({ from: 'root', to: `b${i}` });

      (branch.children || []).forEach((child, j) => {
        const cx = bx + dx * (CHILD_STEP * (j + 1));
        const cy = by + dy * (CHILD_STEP * (j + 1));
        nodes.push({ id: `b${i}c${j}`, label: child.label, icon: child.icon, x: cx, y: cy, r: 30, leaf: true });
        links.push({ from: `b${i}`, to: `b${i}c${j}` });
      });
    });

    return { nodes, links };
  }, [branches, title, icon]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mindmap-svg" width="100%" height="100%">
      <defs>
        <radialGradient id="mm-bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <filter id="mm-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.45)" />
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} rx="18" fill="url(#mm-bg)" />

      {layout.links.map((link, i) => {
        const from = layout.nodes.find((nd) => nd.id === link.from);
        const to = layout.nodes.find((nd) => nd.id === link.to);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <path
            key={i}
            d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
            fill="none"
            stroke="rgba(147,197,253,0.55)"
            strokeWidth="2.5"
            strokeDasharray="6 5"
          />
        );
      })}

      {layout.nodes.map((node) => (
        <g key={node.id} filter="url(#mm-shadow)">
          <circle
            cx={node.x}
            cy={node.y}
            r={node.r}
            fill={node.isRoot ? 'rgba(59,130,246,0.25)' : node.branch ? 'rgba(139,92,246,0.22)' : 'rgba(16,185,129,0.18)'}
            stroke={node.isRoot ? '#60A5FA' : node.branch ? '#A78BFA' : '#34D399'}
            strokeWidth="2.5"
          />
          <text
            x={node.x}
            y={node.y - 4}
            textAnchor="middle"
            fontSize={node.isRoot ? 34 : node.branch ? 28 : 20}
          >
            {node.icon}
          </text>
          <text
            x={node.x}
            y={node.y + (node.isRoot ? 24 : node.branch ? 22 : 18)}
            textAnchor="middle"
            fontSize={node.isRoot ? 13 : node.branch ? 12 : 9.5}
            fontWeight="700"
            fill="#E2E8F0"
            style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {node.label.length > 26 ? `${node.label.slice(0, 25)}…` : node.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const MindMapModal = ({ topic, onClose }) => {
  const [saving, setSaving] = useState(false);

  const branches = useMemo(() => {
    if (!topic) return [];
    const list = [];
    if (topic.videoaulas?.length) {
      list.push({
        label: 'Videoaulas',
        icon: '🎬',
        children: topic.videoaulas.map((v) => ({ label: v.title, icon: '▶️' })),
      });
    }
    if (topic.revisoes?.length) {
      list.push({
        label: 'Revisões',
        icon: '🔄',
        children: topic.revisoes.map((r) => ({ label: r.title, icon: '📘' })),
      });
    }
    if (topic.exercicios?.length) {
      list.push({
        label: 'Exercícios',
        icon: '✏️',
        children: topic.exercicios.map((e) => ({ label: e.name, icon: e.icon || '📝' })),
      });
    }
    list.push({
      label: 'Conceitos',
      icon: '💡',
      children: (topic.keywords || []).map((k) => ({ label: k, icon: '🔑' })),
    });
    return list;
  }, [topic]);

  if (!topic) return null;

  const downloadPng = async () => {
    setSaving(true);
    try {
      const svgEl = document.querySelector('.mindmap-svg');
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svg64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svg64;
      });
      const canvas = document.createElement('canvas');
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0B1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `mapa-mental-${topic.id || 'topico'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Mapa mental salvo como PNG!');
    } catch (e) {
      console.error('Error exporting mind map:', e);
      toast.error('Não foi possível salvar o PNG.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mindmap-overlay" onClick={onClose}>
      <div className="mindmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mindmap-modal-header">
          <div className="mindmap-modal-title">
            <Brain size={20} />
            <div>
              <h3>Mapa Mental - {topic.name}</h3>
              <span>Resumo visual do tópico com desenhos e conceitos</span>
            </div>
          </div>
          <div className="mindmap-modal-actions">
            <button className="mindmap-btn" onClick={downloadPng} disabled={saving}>
              {saving ? <RefreshCw size={16} className="materials-spin" /> : <Download size={16} />}
              Salvar PNG
            </button>
            <button className="mindmap-close" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="mindmap-canvas">
          <MindMapSVG
            title={topic.name}
            icon={topic.icon || '📚'}
            branches={branches}
          />
        </div>
      </div>
    </div>
  );
};

export default MindMapModal;
