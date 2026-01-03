import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

// Memaksa penggunaan Node.js runtime (bukan Edge) karena Edge punya limit size ketat
export const runtime = 'nodejs'; 
// Menambah durasi timeout (jika di Vercel Pro/Hobby)

export const maxDuration = 60;
// --- KONFIGURASI ---
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (Cukup untuk GLB arsitektur)
const ALLOWED_FILE_TYPES = [
  'model/gltf-binary', // .glb
  'model/gltf+json',   // .gltf
  'application/octet-stream', // Kadang GLB terdeteksi sebagai ini
  'image/jpeg',        // .jpg
  'image/png',         // .png
  'image/webp',        // .webp
  'application/pdf'    // .pdf
];
const ALLOWED_FOLDERS = ['models', 'images', 'documents']; // Folder R2 yang diizinkan

// Inisialisasi Supabase Admin (untuk cek token user)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Inisialisasi S3 Client (Cloudflare R2)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    // 1. CEK AUTENTIKASI
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    // 2. PARSE DATA FORM
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const requestedFolder = formData.get('folder') as string || 'others'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 3. VALIDASI FILE
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 400 })
    }

    // Validasi tipe file (sederhana)
    // Kita cek ekstensi juga sebagai fallback jika browser mengirim type aneh
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedExt = ['glb', 'gltf', 'jpg', 'png', 'jpeg', 'pdf'].includes(fileExt);
    
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !isAllowedExt) {
       console.log("Rejected Type:", file.type, fileExt); // Debugging
       return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 4. TENTUKAN FOLDER & NAMA FILE
    // Pastikan folder ada di whitelist, jika tidak lempar ke 'others'
    const targetFolder = ALLOWED_FOLDERS.includes(requestedFolder) ? requestedFolder : 'others';
    
    // Sanitasi nama file (hapus spasi & karakter aneh)
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    // Key (Path) di R2: folder/user_id/timestamp-filename
    const key = `${targetFolder}/${user.id}/${timestamp}-${cleanFileName}`

    // 5. UPLOAD KE R2
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    )

    // 6. GENERATE URL PUBLIC
    // Jika R2_PUBLIC_URL di set (domain kustom), gunakan itu. Jika tidak, pakai R2 default.
    const publicUrl = process.env.R2_PUBLIC_URL 
        ? `${process.env.R2_PUBLIC_URL}/${key}`
        : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`

    return NextResponse.json({ url: publicUrl })

  } catch (err: any) {
    console.error('Upload API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}