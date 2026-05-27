import './globals.css';
import { Toaster } from 'sonner';
export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}<Toaster theme='dark' /></body></html>}
