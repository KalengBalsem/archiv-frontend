import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { supabaseClient } from '@/utils/supabaseClient'

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

// Max file sizes per folder (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  models: 200 * 1024 * 1024,    // 200MB for 3D models (.glb)
  images: 20 * 1024 * 1024,     // 20MB for images
  documents: 100 * 1024 * 1024,  // 100MB for PDFs
  others: 10 * 1024 * 1024,     // 10MB default
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
    // 1. AUTHENTICATION CHECK
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    // 2. PARSE JSON
    const body = await req.json()
    const { filename, filetype, folder, filesize } = body

    if (!filename || !filetype) {
      return NextResponse.json({ error: 'Missing filename or filetype' }, { status: 400 })
    }

    // 3. VALIDATE REQUEST
    const targetFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'others';
    
    // Validate file size if provided
    const maxSize = MAX_FILE_SIZES[targetFolder];
    if (filesize && filesize > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max size for ${targetFolder}: ${Math.round(maxSize / 1024 / 1024)}MB` 
      }, { status: 400 })
    }
    
    const fileExt = filename.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['glb', 'gltf', 'jpg', 'png', 'jpeg', 'pdf', 'webp'].includes(fileExt);
    if (!ALLOWED_FILE_TYPES.includes(filetype) && !isAllowedExt) {
       return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 4. GENERATE KEY (Path)
    const timestamp = Date.now()
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `${targetFolder}/${user.id}/${timestamp}-${cleanFileName}`

    // 5. GENERATE PRESIGNED URL
    // We cast BOTH 's3Client' and 'PutObjectCommand' to 'any'
    // This silences the specific TypeScript version mismatch error.
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: filetype,
      // Optional: Add content-length constraint if filesize provided
      ...(filesize && { ContentLength: filesize }),
    });

    const uploadUrl = await getSignedUrl(s3Client as any, command as any, { expiresIn: 900 });

    // 6. RETURN URLs
    const publicUrl = `https://assets.archiv.tech/${key}`;

    return NextResponse.json({ 
      uploadUrl, 
      publicUrl,
      maxSize: MAX_FILE_SIZES[targetFolder], // Inform client of limit
    })

  } catch (err: any) {
    console.error('Presigned API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}