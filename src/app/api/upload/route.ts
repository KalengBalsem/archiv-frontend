import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createSupabaseServerClient } from '@/utils/supabaseServerClient'
// [NEW] Import crypto to generate UUIDs (Standard Node.js library)
import crypto from 'crypto' 

export const runtime = 'nodejs'; 
export const maxDuration = 10; 

// --- CONFIGURATION ---
const ALLOWED_FOLDERS = ['models', 'images', 'documents'];
const ALLOWED_FILE_TYPES = [
  'model/gltf-binary', 
  'model/gltf+json',   
  'application/octet-stream', 
  'image/jpeg',        
  'image/png',         
  'image/webp',        
  'application/pdf'    
];

const MAX_FILE_SIZES: Record<string, number> = {
  models: 200 * 1024 * 1024,    
  images: 20 * 1024 * 1024,     
  documents: 100 * 1024 * 1024,  
  others: 10 * 1024 * 1024,     
};

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, 
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    // 1. AUTH CHECK - Use server client for proper auth verification
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. PARSE BODY
    const body = await req.json()
    const { filename, filetype, folder, filesize } = body

    if (!filename || !filetype) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    // 3. VALIDATE FILE TYPE (Security: prevent malicious file uploads)
    if (!ALLOWED_FILE_TYPES.includes(filetype)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // 4. VALIDATE FOLDER AND SIZE
    const targetFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'others';
    const maxSize = MAX_FILE_SIZES[targetFolder];
    if (filesize && filesize > maxSize) {
      return NextResponse.json({ error: `File too large (Max ${maxSize / 1024 / 1024}MB)` }, { status: 400 })
    }
    
    // 5. GENERATE KEY (THE GOLD STANDARD)
    // ---------------------------------------------------------
    // A. Clean the filename (Security)
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    // B. Generate UUID (Uniqueness)
    // This creates a string like: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    const uniqueId = crypto.randomUUID(); 
    
    // C. Combine for Final Path
    // Result: models/user_123/f47ac10b-58cc...-house.glb
    const key = `${targetFolder}/${user.id}/${uniqueId}-${cleanFileName}`
    // ---------------------------------------------------------

    // 6. SIGN URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: filetype,
      ...(filesize && { ContentLength: filesize }),
    });

    const uploadUrl = await getSignedUrl(s3Client as any, command as any, { expiresIn: 900 });

    const publicUrl = `https://assets.archiv.tech/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl })

  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}