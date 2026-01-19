import * as pdfjsLib from 'pdfjs-dist';

// Konfigurasi Worker PDF.js untuk Next.js
// Pastikan versi pdfjs-dist di package.json cocok dengan worker ini.
if (typeof window !== 'undefined' && 'Worker' in window) {
  (pdfjsLib.GlobalWorkerOptions as any).workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * ARCH-IV CONFIGURATION
 * Settingan ini menyeimbangkan ketajaman garis CAD dengan ukuran file untuk R2.
 */
interface PdfConfig {
  targetDPI: number;      // 150 DPI = Cukup tajam untuk baca dimensi denah
  maxMegapixels: number;  // 16 MP = Batas aman agar browser HP tidak crash
  quality: number;        // 0.8 = Kualitas WebP optimal
  format: string;         // 'image/webp'
}

const CONFIG: PdfConfig = {
  targetDPI: 150,       
  maxMegapixels: 16,    
  quality: 0.8,
  format: 'image/webp'
};

export const convertPdfToImages = async (
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<File[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const imageFiles: File[] = [];
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      
      // [FIX 1: ANTI-FREEZE]
      // Beri jeda agar UI tidak macet saat render file besar
      await new Promise(resolve => setTimeout(resolve, 0));

      // Update progress bar
      if (onProgress) onProgress(i, totalPages);

      const page = await pdf.getPage(i);
      
      // --- SMART SCALING LOGIC ---
      const defaultViewport = page.getViewport({ scale: 1.0 });
      
      // Hitung scale target (72 DPI -> 150 DPI)
      let scale = CONFIG.targetDPI / 72;
      
      // Cek limit memori agar tidak crash di HP
      let width = defaultViewport.width * scale;
      let height = defaultViewport.height * scale;
      let megaPixels = (width * height) / 1_000_000;

      if (megaPixels > CONFIG.maxMegapixels) {
        const reduction = Math.sqrt(CONFIG.maxMegapixels / megaPixels);
        scale = scale * reduction;
      }

      const viewport = page.getViewport({ scale });

      // --- RENDER (FIXED) ---
      const canvas = document.createElement('canvas');
      
      // [FIX 2: SOFTWARE RENDERING]
      // 'willReadFrequently: true' adalah kunci untuk mengatasi GPU Glitch (Layar Hitam)
      // pada gambar vektor arsitektur yang sangat detail/berat.
      const context = canvas.getContext('2d', { 
        alpha: false, 
        willReadFrequently: true 
      });

      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // [FIX 3: WHITE PAPER BASE]
      // Wajib: Isi canvas dengan cat putih sebelum render PDF.
      // Ini mengatasi PDF transparan yang terlihat hitam di browser.
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // [FIX 4: PRINT INTENT]
      // Mode 'print' memaksa browser meratakan transparansi (flattening).
      // Sangat ampuh untuk file export Revit/InDesign yang punya layer aneh.
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: 'print' 
      };

      await page.render(renderContext as any).promise;

      // --- KOMPRESI ---
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, CONFIG.format, CONFIG.quality)
      );

      if (blob) {
        // Bersihkan nama file
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")     
          .replace(/[^a-zA-Z0-9-_]/g, "_"); 
        
        const newFileName = `${cleanName}_p${i}.webp`; 
        
        const optimizedFile = new File([blob], newFileName, { 
          type: CONFIG.format,
          lastModified: Date.now() 
        });
        
        imageFiles.push(optimizedFile);
      }

      // Bersihkan memori (Penting untuk file berhalaman banyak)
      page.cleanup();
      canvas.remove();
    }

    return imageFiles;

  } catch (error) {
    console.error("ARCH-IV Conversion Error:", error);
    throw new Error("Gagal memproses PDF. Pastikan file tidak rusak.");
  }
};