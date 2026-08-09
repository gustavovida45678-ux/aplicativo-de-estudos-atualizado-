import React from "react";
import { Sigma, Table, BarChart3, X, Loader2 } from "lucide-react";

export function FormulaModal({ open, onClose, latex, onChange, onSubmit, busy }) {
  if (!open) return null;
  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3>
            <Sigma size={18} /> Fórmula Matemática (LaTeX)
          </h3>
          <button className="wb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="wb-modal-desc">Digite uma fórmula em LaTeX. Ex: \frac{a}{b} + \sqrt{x}</p>
        <input
          autoFocus
          value={latex}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="\frac{a}{b}"
          className="wb-modal-input"
        />
        <div className="wb-modal-footer">
          <button className="mini-btn" onClick={onClose}>Cancelar</button>
          <button className="mini-btn primary" onClick={onSubmit} disabled={busy || !latex.trim()}>
            <Sigma size={14} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export function TableModal({ open, onClose, rows, cols, cells, onRows, onCols, onCells, onGenerate, onSubmit }) {
  if (!open) return null;
  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3>
            <Table size={18} /> Criar Tabela
          </h3>
          <button className="wb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="wb-modal-desc">Dimensões da tabela:</p>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Linhas:
            <input type="number" min="1" max="20" value={rows} onChange={(e) => onRows(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="wb-modal-input" style={{ width: "60px" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            Colunas:
            <input type="number" min="1" max="20" value={cols} onChange={(e) => onCols(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="wb-modal-input" style={{ width: "60px" }} />
          </label>
        </div>
        <button className="mini-btn primary" style={{ marginBottom: "12px" }} onClick={onGenerate}>
          Gerar grade de células
        </button>
        <div className="wb-table-editor" style={{ maxHeight: "200px", overflow: "auto" }}>
          {cells.map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: "4px" }}>
              {row.map((cell, ci) => (
                <input
                  key={ri + "-" + ci}
                  value={cell || ""}
                  onChange={(e) => {
                    const newCells = cells.map((r) => [...r]);
                    newCells[ri][ci] = e.target.value;
                    onCells(newCells);
                  }}
                  className="wb-modal-input"
                  style={{ width: "70px", fontSize: "12px", padding: "2px 4px" }}
                  placeholder={(ri + 1) + "," + (ci + 1)}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="wb-modal-footer">
          <button className="mini-btn" onClick={onClose}>Cancelar</button>
          <button className="mini-btn primary" onClick={onSubmit}>
            <Table size={14} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChartModal({ open, onClose, chartType, labels, values, onType, onLabels, onValues, onSubmit }) {
  if (!open) return null;
  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h3>
            <BarChart3 size={18} /> Criar Gráfico
          </h3>
          <button className="wb-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="wb-modal-desc">Configure o tipo e os dados do gráfico.</p>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#7d8590" }}>
          Tipo:
          <select value={chartType} onChange={(e) => onType(e.target.value)} className="shape-select">
            <option value="bar">Barras</option>
            <option value="line">Linha</option>
            <option value="pie">Pizza</option>
          </select>
        </label>
        <input
          autoFocus
          value={labels}
          onChange={(e) => onLabels(e.target.value)}
          placeholder="Rótulos (separados por vírgula): A, B, C"
          className="wb-modal-input"
        />
        <input
          value={values}
          onChange={(e) => onValues(e.target.value)}
          placeholder="Valores (separados por vírgula): 30, 50, 70"
          className="wb-modal-input"
        />
        <div className="wb-modal-footer">
          <button className="mini-btn" onClick={onClose}>Cancelar</button>
          <button className="mini-btn primary" onClick={onSubmit}>
            <BarChart3 size={14} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
