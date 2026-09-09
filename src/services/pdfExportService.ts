import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatRupiah } from './transactionParser';

interface ExportPdfParams {
  periodTitle: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  aiInsights?: string[];
}

export function exportReportToPdf(params: ExportPdfParams) {
  const {
    periodTitle,
    totalIncome,
    totalExpense,
    balance,
    transactions,
    categoryBreakdown,
    aiInsights = []
  } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(36, 161, 222); // Telegram Blue
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN KEUANGAN FINCHAT AI', 14, 13);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode Laporan: ${periodTitle} | Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 21);

  // Financial Summary Cards
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Arus Kas', 14, 38);

  const cardWidth = (pageWidth - 28 - 8) / 3;
  const cardY = 42;
  const cardHeight = 22;

  // 1. Pemasukan Card
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PEMASUKAN', 18, cardY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalIncome), 18, cardY + 16);

  // 2. Pengeluaran Card
  const card2X = 14 + cardWidth + 4;
  doc.setFillColor(255, 241, 242);
  doc.setDrawColor(254, 205, 211);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setTextColor(159, 18, 57);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PENGELUARAN', card2X + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(totalExpense), card2X + 4, cardY + 16);

  // 3. Saldo Card
  const card3X = card2X + cardWidth + 4;
  if (balance >= 0) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.setTextColor(49, 46, 129);
  } else {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.setTextColor(159, 18, 57);
  }
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('NET CASH FLOW', card3X + 4, cardY + 7);
  doc.setFontSize(11);
  doc.text(formatRupiah(balance), card3X + 4, cardY + 16);

  let currentY = cardY + cardHeight + 10;

  // AI Insights Box (if present)
  if (aiInsights.length > 0) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Financial Insights & Rekomendasi', 14, currentY);
    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    
    const insightBoxHeight = Math.min(10 + aiInsights.length * 5.5, 36);
    doc.roundedRect(14, currentY, pageWidth - 28, insightBoxHeight, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    let textY = currentY + 6;
    for (let i = 0; i < Math.min(aiInsights.length, 4); i++) {
      const line = `• ${aiInsights[i]}`;
      const splitText = doc.splitTextToSize(line, pageWidth - 36);
      doc.text(splitText, 18, textY);
      textY += (splitText.length * 4.5);
    }

    currentY += insightBoxHeight + 8;
  }

  // Category Breakdown Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Pengeluaran Berdasarkan Kategori', 14, currentY);
  currentY += 3;

  const categoryRows = categoryBreakdown.map((cat, idx) => [
    (idx + 1).toString(),
    cat.name,
    `${cat.count} Transaksi`,
    formatRupiah(cat.amount),
    `${cat.percentage}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Kategori', 'Jumlah Transaksi', 'Total Nominal', 'Porsi (%)']],
    body: categoryRows.length > 0 ? categoryRows : [['-', 'Tidak ada pengeluaran', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [36, 161, 222],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // Transaction List Table
  const lastTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  let txTableStartY = lastTableY + 8;

  // Add new page if needed before transaction table
  if (txTableStartY > 240) {
    doc.addPage();
    txTableStartY = 16;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rincian Transaksi (${transactions.length} Catatan)`, 14, txTableStartY);
  txTableStartY += 3;

  const transactionRows = transactions.map((t, idx) => [
    (idx + 1).toString(),
    t.transaction_date,
    t.description,
    t.category,
    t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    t.payment_method || 'Tunai',
    (t.type === 'income' ? '+ ' : '- ') + formatRupiah(t.amount)
  ]);

  autoTable(doc, {
    startY: txTableStartY,
    head: [['No', 'Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Metode', 'Nominal']],
    body: transactionRows.length > 0 ? transactionRows : [['-', '-', 'Belum ada transaksi', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Finchat AI • Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  // Sanitize filename
  const cleanTitle = periodTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Keuangan_${cleanTitle}_${Date.now()}.pdf`;
  doc.save(filename);
}
