import { S3, PutObjectCommand } from '@aws-sdk/client-s3'

export async function uploadToS3(
  file: File
): Promise<{ file_key: string; file_name: string }> {
  try {
    const s3 = new S3({
      region: 'eu-north-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
      },
    })

    const file_key =
      'uploads/' + Date.now().toString() + file.name.replace(' ', '-')

    // Convert the File object to a Blob
    const fileBuffer = await file.arrayBuffer()

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: fileBuffer, // Pass the ArrayBuffer here
      ContentType: file.type, // Set the content type
    }

    // Use PutObjectCommand with the send method
    await s3.send(new PutObjectCommand(params))

    return {
      file_key,
      file_name: file.name,
    }
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw error
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${file_key}`
  return url
}
