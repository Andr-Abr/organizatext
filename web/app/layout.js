// web/app/layout.js
import './globals.css';

export const metadata = {
  title: 'Organizatext - Procesamiento de archivos .txt',
  description:
    'Procesa archivos .txt en tu navegador. 100% offline, privado y seguro. Extrae URLs, emails, keywords y organiza automáticamente.',
  keywords: 'procesamiento texto, nlp, privacidad, offline, organizador archivos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}