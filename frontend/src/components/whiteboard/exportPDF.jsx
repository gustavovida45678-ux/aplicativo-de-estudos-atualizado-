import React, { useState } from "react";
import { exportPNG, exportSVG } from "./export";

export function UsePDFExport({ elements, setElements }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const handleExportPDF = async () => {
    if (!elements || elements.length === 0) {
      alert("Nenhum elemento para exportar");
      return;
    }

    setIsGenerating(true);
    try {
      // Usando a função exportPDF do export.js
      const success = await exportPDF(elements);
      if (success) {
        alert("PDF gerado e baixado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-export-btn" onClick={handleExportPDF} aria-label="Exportar PDF">
      <svg 
        width={20} 
        height={20} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm12-6v16c0 1.1-.9 2-2 2h-2c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2zm-9 9h-4v4h4v-4zm-4 4c1.65 0 3 1.35 3 3v4h4v-4h-4v-4h-4v4zm4-12c3.3 0 6 2.7 6 6v14c0 3.3-2.7 6-6 6H7c-3.3 0-6-2.7-6-6V7c0-3.3 2.7-6 6-6zm2 1h-2v14h2V7zm-2 4h2v6h-2v-6zm6 7c-2.21 0-4-1.78-4-4h-2v14h2v-6.01c0-2.22 1.78-4 4-4h2v14h-2v-6.01c0-2.22 1.78-4 4-4zM7 25H5v5h2v-5zm3-3h-2v5h2v-5zm3.51-3.09l-1.46 1.46a2.12 2.12 0 0 1-2.98 0L4.09 15.91a2.12 2.12 0 0 1 0-2.98l1.46-1.46a2.12 2.12 0 0 1 2.98 0L7.09 13.03a2.12 2.12 0 0 1 0 2.98z"/>
      </svg>
      Exportar PDF
    </div>
  );
}
