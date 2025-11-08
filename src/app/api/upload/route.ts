import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export async function POST(req: Request) {
	try {
		const form = await req.formData()
		const file = form.get('file') as File | null
		if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

		const name = (file as any).name || `upload-${Date.now()}`
		const arrayBuffer = await file.arrayBuffer()
		const body = Buffer.from(arrayBuffer)

		const key = `uploads/${Date.now()}-${name}`

		const client = new S3Client({
			region: process.env.R2_REGION || 'auto',
			endpoint: process.env.R2_ENDPOINT, // e.g. https://<account_id>.r2.cloudflarestorage.com
			forcePathStyle: false,
			credentials: {
				accessKeyId: process.env.R2_ACCESS_KEY_ID!,
				secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
			},
		})

		await client.send(
			new PutObjectCommand({
				Bucket: process.env.R2_BUCKET,
				Key: key,
				Body: body,
				ContentType: file.type || 'application/octet-stream',
			})
		)

		const publicUrl = process.env.R2_PUBLIC_URL
			? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
			: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET}/${key}`

		return NextResponse.json({ url: publicUrl })
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Upload error:', err)
		return NextResponse.json({ error: String(err) }, { status: 500 })
	}
}
