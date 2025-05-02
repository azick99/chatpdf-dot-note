'use client'

import { uploadToS3 } from '@/lib/s3'
import { useMutation } from '@tanstack/react-query'
import { Inbox, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import toast from 'react-hot-toast'

const FileUpload = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string
      file_name: string
    }) => {
      const response = await axios.post('/api/create-chat', {
        file_key,
        file_name,
      })
      return response.data // Return the API response
    },
  })

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB.')
        return
      }
      try {
        const data = await uploadToS3(file)
        if (!data?.file_key || !data?.file_name) {
          toast.error('File upload failed.')
          return
        }
        mutate(data, {
          onSuccess: (response) => {
            console.log('API response:', response) // Log the API response
            toast.success('PDF processed successfully!')
          },
          onError: (error) => {
            toast.error(`Error creating chat: ${error || 'Unknown error'}`)
          },
        })
      } catch (error) {
        toast.error(`File upload failed: ${error}`)
      }
    },
  })

  return (
    <div className="p-2 bg-gray-50 rounded-xl w-full">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg py-8 flex justify-center items-center cursor-pointer flex-col"
      >
        <input {...getInputProps()} />
        {isPending ? (
          <Loader2 className="h-10 w-10 animate-spin" />
        ) : (
          <>
            <Inbox className="w-10 h-10 text-slate-500" />
            <p className="mt-2 text-sm text-slate-500">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  )
}

export default FileUpload
