import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'
import Provider from '@/components/Provider'
import { Toaster } from 'react-hot-toast'
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Chat PDF Dot Note',
  description: 'Chat with your PDF documents Easily',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <Provider>
            <Navbar />
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'bg-gray-900 text-white',
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
          </Provider>
        </ClerkProvider>
      </body>
    </html>
  )
}
