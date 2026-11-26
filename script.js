// =========================================================================
// [CORPORATE LOGO CONFIGURATION]
// Replace the URL below with your new logo link in the future.
// Set to "" (empty string) if you ever want to disable the logo completely.
// =========================================================================
const CORPORATE_LOGO_URL = "cartoon-beach-chairs.jpg";
// =========================================================================

// Enable/Disable custom header & footer text boxes based on checkbox
function toggleInput(checkboxId, inputId) {
  const isChecked = document.getElementById(checkboxId).checked;
  document.getElementById(inputId).disabled = !isChecked;
}

// Show/Hide the datatable grid
function toggleDatatable() {
  const isChecked = document.getElementById("chk-datatable").checked;
  document.getElementById("datatable-container").style.display = isChecked ? "block" : "none";
}

// Helper function to load external images safely for jsPDF
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

async function generatePDF() {
  const btn = document.getElementById("download-btn");
  btn.disabled = true;
  btn.textContent = "Generating PDF...";

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); // Standard A4 size: 210mm x 297mm
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Grab form inputs and checkbox states
    const title = document.getElementById("pdf-title").value;
    const bodyText = document.getElementById("pdf-body").value;

    const addTsHeader = document.getElementById("chk-ts-header").checked;
    const addTsFooter = document.getElementById("chk-ts-footer").checked;
    const addCustomHeader = document.getElementById("chk-custom-header").checked;
    const customHeaderText = document.getElementById("txt-custom-header").value;
    const addCustomFooter = document.getElementById("chk-custom-footer").checked;
    const customFooterText = document.getElementById("txt-custom-footer").value;
    const addDatatable = document.getElementById("chk-datatable").checked;

    // Format current date and time
    const now = new Date();
    const timestampString = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Track vertical position (Y-coordinate in mm)
    let currentY = 22;

    // 1. RENDER CENTERED CORPORATE LOGO (Above Document Title)
    if (CORPORATE_LOGO_URL && CORPORATE_LOGO_URL.trim() !== "") {
      try {
        const img = await loadImage(CORPORATE_LOGO_URL);
        
        const maxImgWidth = 170;
        const maxImgHeight = 35;
        const ratio = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
        const finalWidth = img.width * ratio;
        const finalHeight = img.height * ratio;

        // Center horizontally on the page
        const centerX = (pageWidth - finalWidth) / 2;

        doc.addImage(img, "JPEG", centerX, currentY, finalWidth, finalHeight);
        currentY += finalHeight + 10;
      } catch (error) {
        console.warn("Could not load logo (likely blocked by host CORS policy). Proceeding without logo.", error);
      }
    }

    // 2. RENDER DOCUMENT TITLE
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margin, currentY);
    currentY += 5;

    // 3. RENDER DIVIDER LINE
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // 4. RENDER BODY TEXT WITH AUTOMATIC MULTI-PAGE WRAPPING
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(bodyText, pageWidth - (margin * 2));
    const lineHeight = 6.5; // Vertical spacing per line in mm
    const bottomLimit = pageHeight - 22; // Reserve space for footers

    for (let i = 0; i < splitText.length; i++) {
      if (currentY + lineHeight > bottomLimit) {
        doc.addPage();
        currentY = 22; // Reset Y-coordinate at top of new page
      }
      doc.text(splitText.at(i), margin, currentY);
      currentY += lineHeight;
    }

    // 5. RENDER DATATABLE (If checkbox is checked)
    if (addDatatable) {
      currentY += 6; // Add spacing below body text
      if (currentY + 25 > bottomLimit) {
        doc.addPage();
        currentY = 22;
      }

      // Dynamically read all rows and columns from the HTML grid
      const gridRows = document.querySelectorAll("#user-data-grid tr");
      const tableData = [];
      gridRows.forEach(tr => {
        const rowValues = [];
        tr.querySelectorAll("input").forEach(input => {
          rowValues.push(input.value);
        });
        tableData.push(rowValues);
      });

      if (tableData.length > 0) {
        const headRow = tableData.slice(0, 1); // First row becomes styled header
        const bodyRows = tableData.slice(1);   // Remaining rows become table body

        doc.autoTable({
          startY: currentY,
          head: headRow,
          body: bodyRows,
          margin: { top: 22, bottom: 22, left: margin, right: margin },
          theme: "grid",
          headStyles: { fillColor: "#0066cc", textColor: "#ffffff" }
        });
      }
    }

    // 6. STAMP REPEATING HEADERS & FOOTERS ACROSS ALL PAGES
    const totalPages = doc.internal.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);

      // Headers (Top of page, Y = 10mm)
      if (addCustomHeader && customHeaderText.trim() !== "") {
        doc.text(customHeaderText, margin, 10);
      }
      if (addTsHeader) {
        doc.text(timestampString, pageWidth - margin, 10, { align: "right" });
      }

      // Footers (Bottom of page, Y = 287mm)
      if (addCustomFooter && customFooterText.trim() !== "") {
        doc.text(customFooterText, margin, pageHeight - 10);
      }
      if (addTsFooter) {
        doc.text(timestampString, pageWidth - margin, pageHeight - 10, { align: "right" });
      }
    }

    // 7. DOWNLOAD PDF
    doc.save("generated-document.pdf");

  } finally {
    btn.disabled = false;
    btn.textContent = "Download PDF";
  }
}
