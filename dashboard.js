// Initialize data storage
let vehicleEntries = JSON.parse(localStorage.getItem('vehicleEntries')) || [];
let deletedEntries = JSON.parse(localStorage.getItem('deletedEntries')) || [];

// Update dashboard on load
window.onload = function() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userRole').textContent = `Role: ${user.role}`;
        updateDashboard();
    }
};

// Handle vehicle entry form submission
function handleVehicleEntry(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
        const cft = parseFloat(document.getElementById('cft').value);
        const status = document.getElementById('status').value;
        const amount = parseFloat(document.getElementById('amount').value);

        // Validate inputs
        if (!vehicleNumber) {
            alert('Please enter a valid vehicle number');
            return false;
        }

        if (isNaN(cft) || cft <= 0) {
            alert('Please enter a valid CFT value');
            return false;
        }

        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return false;
        }

        const remarks = document.getElementById('remarks').value.trim();
        const entry = {
            date: new Date().toLocaleString(),
            vehicleNumber,
            cft,
            status,
            amount,
            remarks
        };

        // Add entry to storage
        vehicleEntries.push(entry);
        localStorage.setItem('vehicleEntries', JSON.stringify(vehicleEntries));

        // Update dashboard and reset form
        updateDashboard();
        document.getElementById('vehicleForm').reset();

        // Show success popup
        const popup = document.createElement('div');
        popup.className = 'success-popup';
        popup.textContent = 'Data saved successfully!';
        document.body.appendChild(popup);

        // Remove popup after 3 seconds
        setTimeout(() => {
            popup.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                document.body.removeChild(popup);
            }, 300);
        }, 3000);

        return false;
    } catch (error) {
        console.error('Error adding entry:', error);
        alert('An error occurred while adding the entry. Please try again.');
        return false;
    }
}

// Update dashboard statistics and table
function updateDashboard() {
    const stats = vehicleEntries.reduce((acc, entry) => {
        acc.totalAmount += entry.amount;
        
        if (entry.status === 'CO') {
            acc.coCount++;
            acc.coCft += entry.cft;
        } else {
            acc.nonCoCount++;
            acc.nonCoCft += entry.cft;
        }
        
        return acc;
    }, {
        totalAmount: 0,
        coCount: 0,
        nonCoCount: 0,
        coCft: 0,
        nonCoCft: 0
    });

    // Update statistics display
    document.getElementById('totalAmount').textContent = `₹${stats.totalAmount.toFixed(2)}`;
    document.getElementById('coCount').textContent = stats.coCount;
    document.getElementById('nonCoCount').textContent = stats.nonCoCount;
    document.getElementById('coCft').textContent = stats.coCft.toFixed(2);
    document.getElementById('nonCoCft').textContent = stats.nonCoCft.toFixed(2);

    // Update entries table
    const tableBody = document.getElementById('entriesTableBody');
    tableBody.innerHTML = '';
    
    vehicleEntries.slice().reverse().forEach((entry, index) => {
        const row = tableBody.insertRow();
        const values = [entry.date, entry.vehicleNumber, entry.cft, entry.status, entry.amount, entry.remarks];
        values.forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value || '';
        });
        
        // Add action buttons
        const actionsCell = row.insertCell();
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.onclick = () => deleteEntry(index);
        actionsCell.appendChild(deleteBtn);
    });

    // Update deleted entries if they exist
    const deletedBody = document.getElementById('deletedEntriesBody');
    if (deletedBody) {
        deletedBody.innerHTML = '';
        deletedEntries.slice().reverse().forEach((entry, index) => {
            const row = deletedBody.insertRow();
            const values = [entry.date, entry.vehicleNumber, entry.cft, entry.status, entry.amount];
            values.forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value || '';
            });
            
            // Add restore button
            const actionsCell = row.insertCell();
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = 'Restore';
            restoreBtn.className = 'action-btn restore-btn';
            restoreBtn.onclick = () => restoreEntry(index);
            actionsCell.appendChild(restoreBtn);
        });
    }
}

// Generate PDF report
// Delete entry function
function deleteEntry(index) {
    const entry = vehicleEntries[vehicleEntries.length - 1 - index];
    vehicleEntries.splice(vehicleEntries.length - 1 - index, 1);
    deletedEntries.push(entry);
    
    localStorage.setItem('vehicleEntries', JSON.stringify(vehicleEntries));
    localStorage.setItem('deletedEntries', JSON.stringify(deletedEntries));
    
    updateDashboard();
}

// Restore entry function
function restoreEntry(index) {
    const entry = deletedEntries[deletedEntries.length - 1 - index];
    deletedEntries.splice(deletedEntries.length - 1 - index, 1);
    vehicleEntries.push(entry);
    
    localStorage.setItem('vehicleEntries', JSON.stringify(vehicleEntries));
    localStorage.setItem('deletedEntries', JSON.stringify(deletedEntries));
    
    updateDashboard();
}

function generatePDF() {
    try {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF generation library not loaded. Please refresh the page.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const headerHeight = 40;

        // Header section
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Vehicle Management System', pageWidth / 2, 20, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });

        // Statistics section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary Statistics', margin, 55);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const stats = [
            ['Total Amount:', document.getElementById('totalAmount').textContent.replace('₹', '')],
            ['CO Entries:', document.getElementById('coCount').textContent],
            ['NON-CO Entries:', document.getElementById('nonCoCount').textContent],
            ['Total CO CFT:', document.getElementById('coCft').textContent],
            ['Total NON-CO CFT:', document.getElementById('nonCoCft').textContent]
        ];

        let yPos = 65;
        stats.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 40, yPos);
            yPos += 8;
        });

        // Table section
        yPos = 110;
        const columns = [
            { header: 'Date', x: margin, width: 40 },
            { header: 'Vehicle No.', x: margin + 40, width: 35 },
            { header: 'CFT', x: margin + 75, width: 25 },
            { header: 'Status', x: margin + 100, width: 25 },
            { header: 'Amount', x: margin + 125, width: 35 },
            { header: 'Remarks', x: margin + 160, width: 70 }
        ];

        const addTableHeaders = (y) => {
            // Header background
            doc.setFillColor(52, 73, 94);
            doc.rect(margin, y - 10, pageWidth - (margin * 2), 10, 'F');

            // Header text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);

            columns.forEach(col => {
                doc.text(col.header, col.x, y - 3);
            });
        };

        addTableHeaders(yPos);
        doc.setTextColor(0, 0, 0);

        // Table content
        yPos += 5;
        vehicleEntries.slice().reverse().forEach((entry, index) => {
            if (yPos > pageHeight - margin) {
                doc.addPage();
                yPos = margin + 20;
                addTableHeaders(yPos);
                yPos += 5;
            }

            // Alternating row background
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 8, 'F');
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // Format and align data
            doc.text(entry.date, columns[0].x, yPos);
            doc.text(entry.vehicleNumber, columns[1].x, yPos);
            doc.text(entry.cft.toFixed(2), columns[2].x, yPos, { align: 'left' });
            doc.text(entry.status, columns[3].x, yPos);
            doc.text(`${entry.amount.toFixed(2)}`, columns[4].x, yPos, { align: 'left' });
            doc.text(entry.remarks || '-', columns[5].x, yPos);

            yPos += 8;
        });

        // Save PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        doc.save(`vehicle_report_${timestamp}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please try again.');
    }
}