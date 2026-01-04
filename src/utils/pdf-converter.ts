import * as pdfjsLib from 'pdfjs-dist';

// Konfigurasi Worker PDF.js untuk Next.js
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
  quality: number;        // 0.8 = Kualitas WebP optimal (teks tajam, putih bersih)
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
  onProgress?: (current: number, total: number) => void // Opsional: Untuk Loading Bar
): Promise<File[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const imageFiles: File[] = [];
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      
      // [FIX 1: ANTI-LAG]
      // Beri jeda 0 detik agar Main Thread browser sempat bernapas/render UI
      // Ini mencegah pesan "Page Unresponsive" saat convert file besar.
      await new Promise(resolve => setTimeout(resolve, 0));

      // Update progress jika ada callback
      if (onProgress) onProgress(i, totalPages);

      const page = await pdf.getPage(i);
      
      // --- SMART SCALING LOGIC ---
      const defaultViewport = page.getViewport({ scale: 1.0 });
      
      // Hitung scale target (misal dari 72 DPI ke 150 DPI)
      let scale = CONFIG.targetDPI / 72;
      
      // Cek apakah hasil gambar akan terlalu raksasa (bahaya crash)
      let width = defaultViewport.width * scale;
      let height = defaultViewport.height * scale;
      let megaPixels = (width * height) / 1_000_000;

      // Jika melebihi batas aman (misal poster A0), kecilkan otomatis
      if (megaPixels > CONFIG.maxMegapixels) {
        const reduction = Math.sqrt(CONFIG.maxMegapixels / megaPixels);
        scale = scale * reduction;
      }

      const viewport = page.getViewport({ scale });

      // --- RENDER ---
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });

      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ 
        canvasContext: context, 
        viewport: viewport 
      } as any).promise;

      // --- KOMPRESI ---
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, CONFIG.format, CONFIG.quality)
      );

      if (blob) {
        // [FIX 2: FILENAME & EXTENSION]
        // 1. Bersihkan nama file dari karakter aneh
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")     // Buang ekstensi lama (.pdf)
          .replace(/[^a-zA-Z0-9-_]/g, "_"); // Ganti spasi/simbol dengan _
        
        // 2. PASTIkan ekstensi .webp tertulis eksplisit
        const newFileName = `${cleanName}_p${i}.webp`; 
        
        const optimizedFile = new File([blob], newFileName, { 
          type: CONFIG.format,
          lastModified: Date.now() 
        });
        
        imageFiles.push(optimizedFile);
      }

      // Bersihkan memori per halaman
      page.cleanup();
      canvas.remove();
    }

    return imageFiles;

  } catch (error) {
    console.error("ARCH-IV Conversion Error:", error);
    throw new Error("Gagal memproses PDF. File mungkin rusak atau terproteksi password.");
  }
};