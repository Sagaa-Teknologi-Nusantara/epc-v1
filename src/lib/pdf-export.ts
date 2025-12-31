import jsPDF from 'jspdf';

// Types
export interface PDFExportOptions {
    title: string;
    weekNo?: number | string;
    projectName?: string;
    periodStart?: string;
    periodEnd?: string;
}

interface Section {
    title: string;
    content: SectionContent[];
}

type SectionContent =
    | { type: 'keyValue'; label: string; value: string; highlight?: boolean }
    | { type: 'statsRow'; items: Array<{ label: string; value: string; status?: 'good' | 'warning' | 'bad' | 'neutral' }> }
    | { type: 'progressBar'; label: string; plan: number; actual: number }
    | { type: 'chart'; svgElement?: SVGElement; width?: number; height?: number; fallbackText?: string }
    | { type: 'text'; text: string; size?: 'small' | 'normal'; color?: string };

// Colors
const COLORS = {
    teal: { r: 15, g: 118, b: 110 },
    darkGray: { r: 51, g: 65, b: 85 },
    gray: { r: 100, g: 116, b: 139 },
    green: { r: 34, g: 197, b: 94 },
    red: { r: 239, g: 68, b: 68 },
    amber: { r: 245, g: 158, b: 11 },
    white: { r: 255, g: 255, b: 255 },
    lightGray: { r: 226, g: 232, b: 240 },
};

// Convert SVG element to data URL
export async function svgToDataURL(svgElement: SVGElement): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // Clone the SVG to avoid modifying the original
            const clonedSvg = svgElement.cloneNode(true) as SVGElement;

            // Get computed styles and inline them
            const computedStyle = window.getComputedStyle(svgElement);

            // Ensure dimensions
            const width = parseInt(computedStyle.width) || svgElement.getBoundingClientRect().width || 300;
            const height = parseInt(computedStyle.height) || svgElement.getBoundingClientRect().height || 200;

            clonedSvg.setAttribute('width', String(width));
            clonedSvg.setAttribute('height', String(height));

            // Convert lab() colors to rgb in the SVG
            const svgString = new XMLSerializer().serializeToString(clonedSvg);

            // Create a canvas
            const canvas = document.createElement('canvas');
            canvas.width = width * 2; // 2x for better quality
            canvas.height = height * 2;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Cannot get canvas context'));
                return;
            }

            // Create image from SVG
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.scale(2, 2);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load SVG as image'));
            };

            img.src = url;
        } catch (error) {
            reject(error);
        }
    });
}

// Create PDF exporter class
export class PDFExporter {
    private pdf: jsPDF;
    private pageWidth: number;
    private pageHeight: number;
    private margin: number = 12;
    private currentY: number = 0;
    private pageNum: number = 1;
    private options: PDFExportOptions;

    constructor(options: PDFExportOptions) {
        this.pdf = new jsPDF('p', 'mm', 'a4');
        this.pageWidth = this.pdf.internal.pageSize.getWidth();
        this.pageHeight = this.pdf.internal.pageSize.getHeight();
        this.options = options;
        this.currentY = 28; // Start after header
    }

    private get contentWidth(): number {
        return this.pageWidth - (this.margin * 2);
    }

    // Add header
    addHeader(): void {
        const { teal, white } = COLORS;

        this.pdf.setFillColor(teal.r, teal.g, teal.b);
        this.pdf.rect(0, 0, this.pageWidth, 22, 'F');

        this.pdf.setTextColor(white.r, white.g, white.b);
        this.pdf.setFontSize(14);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`EPC Weekly Report - ${this.options.title}`, this.margin, 10);

        this.pdf.setFontSize(9);
        this.pdf.setFont('helvetica', 'normal');

        const infoY = 18;
        if (this.options.weekNo) {
            this.pdf.text(`Week ${this.options.weekNo}`, this.margin, infoY);
        }
        if (this.options.periodStart && this.options.periodEnd) {
            this.pdf.text(`Period: ${this.options.periodStart} - ${this.options.periodEnd}`, this.pageWidth / 2, infoY, { align: 'center' });
        }
        if (this.options.projectName) {
            this.pdf.text(this.options.projectName, this.pageWidth - this.margin, infoY, { align: 'right' });
        }

        this.pdf.setTextColor(0, 0, 0);
    }

    // Add footer
    addFooter(totalPages?: number): void {
        const { gray } = COLORS;
        const y = this.pageHeight - 6;

        this.pdf.setFontSize(8);
        this.pdf.setTextColor(gray.r, gray.g, gray.b);
        this.pdf.text(this.options.projectName || 'EPC Project', this.margin, y);
        this.pdf.text(
            `Page ${this.pageNum}${totalPages ? ` of ${totalPages}` : ''}`,
            this.pageWidth / 2, y, { align: 'center' }
        );
        this.pdf.text(
            new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            this.pageWidth - this.margin, y, { align: 'right' }
        );
    }

    // Check if we need a new page
    private checkNewPage(neededHeight: number): void {
        if (this.currentY + neededHeight > this.pageHeight - 15) {
            this.addFooter();
            this.pdf.addPage();
            this.pageNum++;
            this.addHeader();
            this.currentY = 28;
        }
    }

    // Add section title bar
    addSectionTitle(title: string): void {
        this.checkNewPage(12);

        const { teal, white } = COLORS;

        this.pdf.setFillColor(teal.r, teal.g, teal.b);
        this.pdf.rect(this.margin, this.currentY, this.contentWidth, 7, 'F');

        this.pdf.setTextColor(white.r, white.g, white.b);
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(title, this.margin + 3, this.currentY + 5);

        this.pdf.setTextColor(0, 0, 0);
        this.currentY += 10;
    }

    // Add key-value row
    addKeyValue(label: string, value: string, highlight = false): void {
        this.checkNewPage(6);

        const { gray, darkGray } = COLORS;

        this.pdf.setFontSize(9);
        this.pdf.setTextColor(gray.r, gray.g, gray.b);
        this.pdf.text(label, this.margin, this.currentY);

        this.pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        if (highlight) this.pdf.setFont('helvetica', 'bold');
        else this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(value, this.margin + 50, this.currentY);

        this.currentY += 5;
    }

    // Add stats boxes row
    addStatsRow(items: Array<{ label: string; value: string; status?: 'good' | 'warning' | 'bad' | 'neutral' }>): void {
        const boxHeight = 16;
        this.checkNewPage(boxHeight + 4);

        const boxWidth = (this.contentWidth - ((items.length - 1) * 3)) / items.length;

        items.forEach((item, index) => {
            const x = this.margin + (index * (boxWidth + 3));
            const color = item.status === 'good' ? COLORS.green :
                item.status === 'warning' ? COLORS.amber :
                    item.status === 'bad' ? COLORS.red : COLORS.teal;

            // Box background (lighter version)
            this.pdf.setFillColor(color.r, color.g, color.b);
            this.pdf.setDrawColor(color.r, color.g, color.b);
            this.pdf.roundedRect(x, this.currentY, boxWidth, boxHeight, 2, 2, 'D');

            // Value
            this.pdf.setFontSize(12);
            this.pdf.setFont('helvetica', 'bold');
            this.pdf.setTextColor(color.r, color.g, color.b);
            this.pdf.text(item.value, x + boxWidth / 2, this.currentY + 7, { align: 'center' });

            // Label
            this.pdf.setFontSize(7);
            this.pdf.setFont('helvetica', 'normal');
            this.pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
            this.pdf.text(item.label, x + boxWidth / 2, this.currentY + 13, { align: 'center' });
        });

        this.currentY += boxHeight + 4;
    }

    // Add progress bar
    addProgressBar(label: string, plan: number, actual: number): void {
        this.checkNewPage(10);

        const { darkGray, gray, lightGray, green, amber, red } = COLORS;
        const variance = actual - plan;
        const barColor = variance >= 0 ? green : variance >= -5 ? amber : red;

        // Label
        this.pdf.setFontSize(9);
        this.pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        this.pdf.text(label, this.margin, this.currentY + 4);

        // Progress bar background
        const barX = this.margin + 40;
        const barWidth = 70;
        this.pdf.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        this.pdf.rect(barX, this.currentY, barWidth, 5, 'F');

        // Progress bar fill
        const fillWidth = Math.min((actual / 100) * barWidth, barWidth);
        this.pdf.setFillColor(barColor.r, barColor.g, barColor.b);
        this.pdf.rect(barX, this.currentY, fillWidth, 5, 'F');

        // Values
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        this.pdf.text(`${actual.toFixed(1)}%`, barX + barWidth + 3, this.currentY + 4);
        this.pdf.setTextColor(gray.r, gray.g, gray.b);
        this.pdf.text(`(Plan: ${plan.toFixed(1)}%)`, barX + barWidth + 18, this.currentY + 4);

        this.currentY += 8;
    }

    // Add chart image
    async addChart(svgElement: SVGElement, width?: number, height?: number): Promise<void> {
        try {
            const imgData = await svgToDataURL(svgElement);
            const imgWidth = width || this.contentWidth;
            const imgHeight = height || 60;

            this.checkNewPage(imgHeight + 5);

            this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
            this.currentY += imgHeight + 5;
        } catch (error) {
            console.error('Failed to add chart:', error);
            // Add fallback text
            this.addText('[Chart could not be rendered]', 'small', COLORS.gray);
        }
    }

    // Add text
    addText(text: string, size: 'small' | 'normal' = 'normal', color = COLORS.darkGray): void {
        this.checkNewPage(6);

        this.pdf.setFontSize(size === 'small' ? 8 : 9);
        this.pdf.setTextColor(color.r, color.g, color.b);
        this.pdf.text(text, this.margin, this.currentY);
        this.currentY += size === 'small' ? 4 : 5;
    }

    // Add spacing
    addSpacing(mm: number = 5): void {
        this.currentY += mm;
    }

    // Save PDF
    save(filename: string): void {
        this.addFooter(this.pageNum);
        this.pdf.save(filename);
    }

    // Get current Y position
    getY(): number {
        return this.currentY;
    }

    // Set Y position
    setY(y: number): void {
        this.currentY = y;
    }
}

// Quick export function for simple cases
export async function quickExportToPDF(
    options: PDFExportOptions,
    buildContent: (exporter: PDFExporter) => Promise<void>,
    filename: string
): Promise<void> {
    const exporter = new PDFExporter(options);
    exporter.addHeader();
    await buildContent(exporter);
    exporter.save(filename);
}
