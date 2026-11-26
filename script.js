// =========================================================================
// PART A: UI CONTROLS, CSV IMPORTER, TABLE TRIMMING & IMAGE LOADERS (DYNAMIC FILENAME?)
// =========================================================================

function getDefaultFilename() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${min}_doc`;
}

window.addEventListener("DOMContentLoaded", () => {
  const filenameInput = document.getElementById("pdf-filename");
  if (filenameInput && filenameInput.value.trim() === "") {
    filenameInput.value = getDefaultFilename();
  }
});

function toggleInput(checkboxId, inputId) {
  const isChecked = document.getElementById(checkboxId).checked;
  document.getElementById(inputId).disabled = !isChecked;
}

function toggleSection(checkboxId, sectionId) {
  const isChecked = document.getElementById(checkboxId).checked;
  document.getElementById(sectionId).style.display = isChecked ? "block" : "none";
}

function handleLogoFileSelect() {
  const fileInput = document.getElementById("logo-file");
  const urlInput = document.getElementById("logo-url");
  const clearBtn = document.getElementById("clear-logo-btn");

  if (fileInput.files && fileInput.files.length > 0) {
    urlInput.disabled = true;
    clearBtn.style.display = "inline-block";
  } else {
    urlInput.disabled = false;
    clearBtn.style.display = "none";
  }
}

function clearLogoFile() {
  const fileInput = document.getElementById("logo-file");
  fileInput.value = "";
  handleLogoFileSelect();
}

function handlePicturesSelect() {
  const picInput = document.getElementById("doc-pictures");
  const clearBtn = document.getElementById("clear-pictures-btn");
  clearBtn.style.display = (picInput.files && picInput.files.length > 0) ? "inline-block" : "none";
}

function clearPictures() {
  const picInput = document.getElementById("doc-pictures");
  picInput.value = "";
  handlePicturesSelect();
}

// Check column count and show/hide the Landscape + Small Font tip banner
function updateWideTableTip() {
  const table = document.getElementById("user-data-grid");
  const tip = document.getElementById("wide-table-tip");
  if (!table || !table.rows.length || !tip) return;

  const colCount = table.rows.item(0).cells.length;
  tip.style.display = colCount > 6 ? "block" : "none";
}

function addRow() {
  const table = document.getElementById("user-data-grid");
  const colCount = table.rows.item(0).cells.length;
  const newRow = table.insertRow(-1);
  const rowNum = table.rows.length;

  for (let c = 0; c < colCount; c++) {
    const newCell = newRow.insertCell(c);
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Row ${rowNum}, Col ${c + 1}`;
    newCell.appendChild(input);
  }
}

function removeRow() {
  const table = document.getElementById("user-data-grid");
  if (table.rows.length > 2) {
    table.deleteRow(-1);
  }
}

function addColumn() {
  const table = document.getElementById("user-data-grid");
  const rowCount = table.rows.length;
  const newColNum = table.rows.item(0).cells.length + 1;

  for (let r = 0; r < rowCount; r++) {
    const row = table.rows.item(r);
    const newCell = row.insertCell(-1);
    const input = document.createElement("input");
    input.type = "text";

    if (r === 0) {
      input.value = `Header ${newColNum}`;
    } else {
      input.placeholder = `Row ${r + 1}, Col ${newColNum}`;
    }
    newCell.appendChild(input);
  }
  updateWideTableTip();
}

function removeColumn() {
  const table = document.getElementById("user-data-grid");
  const colCount = table.rows.item(0).cells.length;

  if (colCount > 1) {
    for (let r = 0; r < table.rows.length; r++) {
      table.rows.item(r).deleteCell(-1);
    }
  }
  updateWideTableTip();
}

// Delete a specific column by 1-based column number
function deleteSpecificColumn() {
  const colNum = parseInt(document.getElementById("del-col-num").value, 10);
  const table = document.getElementById("user-data-grid");
  const colCount = table.rows.item(0).cells.length;

  if (isNaN(colNum) || colNum < 1 || colNum > colCount) {
    alert(`Please enter a valid column number between 1 and ${colCount}.`);
    return;
  }
  if (colCount <= 1) {
    alert("You must keep at least 1 column.");
    return;
  }

  const targetIndex = colNum - 1;
  for (let r = 0; r < table.rows.length; r++) {
    table.rows.item(r).deleteCell(targetIndex);
  }
  document.getElementById("del-col-num").value = "";
  updateWideTableTip();
}

// Delete a specific row by 1-based row number (protects Row 1 header)
function deleteSpecificRow() {
  const rowNum = parseInt(document.getElementById("del-row-num").value, 10);
  const table = document.getElementById("user-data-grid");
  const rowCount = table.rows.length;

  if (isNaN(rowNum) || rowNum < 2 || rowNum > rowCount) {
    alert(`Please enter a valid data row number between 2 and ${rowCount} (Row 1 is the header).`);
    return;
  }
  if (rowCount <= 2) {
    alert("You must keep at least 1 data row.");
    return;
  }

  table.deleteRow(rowNum - 1);
  document.getElementById("del-row-num").value = "";
}

// Keep header row + any rows containing the keyword (removes non-matching rows)
function filterTableRows() {
  const keyword = document.getElementById("filter-keyword").value.trim().toLowerCase();
  if (keyword === "") {
    alert("Enter a keyword or strike price first to filter rows.");
    return;
  }

  const table = document.getElementById("user-data-grid");
  // Loop backwards from bottom row down to Row 2 (index 1) so row indices don't shift
  for (let r = table.rows.length - 1; r >= 1; r--) {
    const row = table.rows.item(r);
    const rowInputs = Array.from(row.querySelectorAll("input"));
    const rowText = rowInputs.map(inp => inp.value.toLowerCase()).join(" ");

    if (!rowText.includes(keyword)) {
      table.deleteRow(r);
    }
  }
}

function clearTable() {
  const inputs = document.querySelectorAll("#user-data-grid input");
  inputs.forEach(input => {
    input.value = "";
  });
}

// Parse a single CSV line safely (handles quoted values containing commas)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line.charAt(i);
    if (char === '"') {
      if (inQuotes && line.charAt(i + 1) === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read uploaded CSV file and rebuild the HTML grid cleanly
function importCSV(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const file = files.item(0);
  const reader = new FileReader();

  reader.onload = function(e) {
    const text = e.target.result;
    // Split into lines and ignore blank lines or "--- Table X ---" banner lines
    const rawLines = text.split(/\r?\n/).filter(line => {
      const trimmed = line.trim();
      return trimmed !== "" && !/^"?--- Table \d+ ---"?$/i.test(trimmed);
    });

    if (rawLines.length === 0) {
      alert("The selected CSV file appears to be empty.");
      return;
    }

    const parsedRows = rawLines.map(line => parseCSVLine(line));

    // Find maximum column width across all rows so every row aligns cleanly
    let maxCols = 0;
    parsedRows.forEach(row => {
      if (row.length > maxCols) maxCols = row.length;
    });

    const table = document.getElementById("user-data-grid");
    table.innerHTML = "";

    parsedRows.forEach((cells, rowIndex) => {
      const tr = table.insertRow(-1);
      for (let colIndex = 0; colIndex < maxCols; colIndex++) {
        const td = tr.insertCell(-1);
        const input = document.createElement("input");
        input.type = "text";
        input.value = cells.at(colIndex) !== undefined ? cells.at(colIndex) : "";
        input.placeholder = rowIndex === 0 ? `Header ${colIndex + 1}` : `Row ${rowIndex + 1}, Col ${colIndex + 1}`;
        td.appendChild(input);
      }
    });

    // Automatically suggest Landscape & smaller font if CSV is wide (> 6 columns)
    if (maxCols > 6) {
      document.getElementById("page-orientation").value = "landscape";
      document.getElementById("table-font-size").value = maxCols > 10 ? "5" : "6";
    }
    updateWideTableTip();

    event.target.value = "";
  };

  reader.readAsText(file);
}

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

function imageToPngDataUrl(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

// =========================================================================
// PART B: MAIN PDF GENERATION & DOWNLOAD LOGIC
// =========================================================================

async function generatePDF() {
  const btn = document.getElementById("download-btn");
  btn.disabled = true;
  btn.textContent = "Generating PDF...";

  try {
    // 1. INITIALIZE PDF WITH SELECTED ORIENTATION & PAPER SIZE
    const orientation = document.getElementById("page-orientation").value; // "portrait" or "landscape"
    const format = document.getElementById("page-size").value; // "a4" or "letter"

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: format
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2);
    const bottomLimit = pageHeight - 22;

    // Grab form inputs and checkbox states
    const includeLogo = document.getElementById("chk-logo").checked;
    const logoFileInput = document.getElementById("logo-file");
    const logoUrlInput = document.getElementById("logo-url").value.trim();

    const includeTitle = document.getElementById("chk-title").checked;
    const title = document.getElementById("pdf-title").value;
    const bodyText = document.getElementById("pdf-body").value;

    const bodyFontFamily = document.getElementById("body-font-family").value;
    const bodyFontSize = Number(document.getElementById("body-font-size").value);

    const addTsHeader = document.getElementById("chk-ts-header").checked;
    const addTsFooter = document.getElementById("chk-ts-footer").checked;
    const addCustomHeader = document.getElementById("chk-custom-header").checked;
    const customHeaderText = document.getElementById("txt-custom-header").value;
    const addCustomFooter = document.getElementById("chk-custom-footer").checked;
    const customFooterText = document.getElementById("txt-custom-footer").value;

    const addDatatable = document.getElementById("chk-datatable").checked;
    const includePictures = document.getElementById("chk-pictures").checked;
    const picturesInput = document.getElementById("doc-pictures");

    // Format current date and time for headers/footers
    const now = new Date();
    const timestampString = `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Track vertical position (Y-coordinate in mm)
    let currentY = 22;

    // 2. RENDER CENTERED CORPORATE LOGO (Only if checked)
    if (includeLogo) {
      let img = null;
      try {
        if (logoFileInput.files && logoFileInput.files.length > 0) {
          img = await loadImageFromFile(logoFileInput.files.item(0));
        } else if (logoUrlInput !== "") {
          img = await loadImageFromUrl(logoUrlInput);
        }

        if (img) {
          const maxImgWidth = usableWidth;
          const maxImgHeight = 35;
          const ratio = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
          const finalWidth = img.width * ratio;
          const finalHeight = img.height * ratio;
          const centerX = (pageWidth - finalWidth) / 2;

          const dataUrl = imageToPngDataUrl(img);
          doc.addImage(dataUrl, "PNG", centerX, currentY, finalWidth, finalHeight);
          currentY += finalHeight + 10;
        }
      } catch (error) {
        console.warn("Could not load logo. Proceeding without logo.", error);
      }
    }

    // 3. RENDER DOCUMENT TITLE & DIVIDER (Only if checked)
    if (includeTitle) {
      doc.setTextColor(0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(title, margin, currentY);
      currentY += 5;

      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
    }

    // 4. RENDER BODY TEXT WITH SELECTED FONT & SIZE (8pt - 16pt)
    doc.setTextColor(0);
    doc.setFont(bodyFontFamily, "normal");
    doc.setFontSize(bodyFontSize);

    const splitText = doc.splitTextToSize(bodyText, usableWidth);
    const lineHeight = bodyFontSize * 0.48;

    for (let i = 0; i < splitText.length; i++) {
      if (currentY + lineHeight > bottomLimit) {
        doc.addPage();
        currentY = 22;
      }
      doc.text(splitText.at(i), margin, currentY);
      currentY += lineHeight;
    }

    // 5. RENDER DATATABLE (If checked)
    if (addDatatable) {
      currentY += 6;
      if (currentY + 25 > bottomLimit) {
        doc.addPage();
        currentY = 22;
      }

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
        const headRow = tableData.slice(0, 1);
        const bodyRows = tableData.slice(1);
        const colCount = headRow.at(0).length;

        const tableFontSize = Number(document.getElementById("table-font-size").value);
        // Use tighter side margins (10mm) and tighter cell padding for wide tables (> 6 columns)
        const tableSideMargin = colCount > 6 ? 10 : margin;
        const dynamicPadding = colCount > 8 ? 1.2 : 2.5;

        doc.autoTable({
          startY: currentY,
          head: headRow,
          body: bodyRows,
          margin: { top: 22, bottom: 22, left: tableSideMargin, right: tableSideMargin },
          theme: "grid",
          styles: {
            fontSize: tableFontSize,
            cellPadding: dynamicPadding,
            overflow: "linebreak",
            valign: "middle"
          },
          headStyles: {
            fillColor: "#0066cc",
            textColor: "#ffffff",
            fontSize: tableFontSize,
            fontStyle: "bold"
          }
        });

        currentY = doc.lastAutoTable.finalY + 10;
      }
    }


    // 6. RENDER UPLOADED PICTURES AT THE END OF THE DOCUMENT (If checked)
    if (includePictures && picturesInput.files && picturesInput.files.length > 0) {
      currentY += 4;
      const maxPicHeight = pageHeight - 48; // Max height allowed on a single page

      for (let i = 0; i < picturesInput.files.length; i++) {
        try {
          const picFile = picturesInput.files.item(i);
          const img = await loadImageFromFile(picFile);

          const ratio = Math.min(usableWidth / img.width, maxPicHeight / img.height);
          const finalWidth = img.width * ratio;
          const finalHeight = img.height * ratio;

          // Move to a new page if the picture doesn't fit in the remaining space
          if (currentY + finalHeight > bottomLimit) {
            doc.addPage();
            currentY = 22;
          }

          const centerX = (pageWidth - finalWidth) / 2;
          const dataUrl = imageToPngDataUrl(img);

          doc.addImage(dataUrl, "PNG", centerX, currentY, finalWidth, finalHeight);
          currentY += finalHeight + 10;
        } catch (err) {
          console.warn("Could not load one of the uploaded pictures:", err);
        }
      }
    }

    // 7. STAMP REPEATING HEADERS, FOOTERS & CONDITIONAL PAGE NUMBERS
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

      // Footers (Bottom of page)
      if (addCustomFooter && customFooterText.trim() !== "") {
        doc.text(customFooterText, margin, pageHeight - 10);
      }

      // Show "Page X of Y" centered ONLY if there is more than 1 page
      if (totalPages > 1) {
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      if (addTsFooter) {
        doc.text(timestampString, pageWidth - margin, pageHeight - 10, { align: "right" });
      }
    }

    // 8. SANITIZE CUSTOM FILENAME & DOWNLOAD PDF
    let rawFilename = document.getElementById("pdf-filename").value.trim();
    if (rawFilename === "") {
      rawFilename = getDefaultFilename();
    }
    rawFilename = rawFilename.replace(/\.pdf$/i, "");
    doc.save(`${rawFilename}.pdf`);

  } finally {
    btn.disabled = false;
    btn.textContent = "Download PDF";
  }
}
