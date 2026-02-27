// web/components/BannerLimit.jsx
export default function BannerLimit() {
  const handleReadmeClick = () => {
    window.open('https://github.com/Andr-Abr/organizatext/blob/main/README.md', '_blank');
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>Límite de uso:</strong> máximo 50 MB total, 10 MB por archivo, hasta 200 archivos.
            Para procesar más, y otros formatos (pdf, word, md) ejecuta la app localmente{' '}
            <button
              onClick={handleReadmeClick}
              className="underline font-medium hover:text-blue-900 text-blue-700"
            >
              (ver README)
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}