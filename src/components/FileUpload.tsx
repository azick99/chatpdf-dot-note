'use client'
import { uploadToS3 } from '@/lib/s3'
import { Inbox } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles)

      const file = acceptedFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB, please upload a smaller file.')
        return
      }
      try {
        const data = await uploadToS3(file)
        console.log('File uploaded successfully:', data)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    },
  })
  return (
    <div className="p-2 bg-gray-50 rounded-xl w-full">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg py-8 flex justify-center items-center cursor-pointer flex-col "
      >
        <input {...getInputProps()} />
        <>
          <Inbox className="w-10 h-10 text-slate-500 " />
          <p className="mt-2 text-sm text-slate-500">Drop PDF Here</p>
        </>
      </div>
    </div>
  )
}

export default FileUpload
