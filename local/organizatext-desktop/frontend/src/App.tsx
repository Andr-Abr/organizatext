import { useState, useEffect, MouseEvent } from 'react'
import './App.css'
import JSZip from 'jszip'

interface Document {
  id: string
  text: string
  metadata: {
    filename: string
    word_count: number
    uploaded_at: string
    category?: string
    tags?: string[]
  }
}

const DEFAULT_CATEGORIES = [
  'Sin clasificar',
  'Proyectos',
  'Ideas',
  'Investigación',
  'Finanzas',
  'Personal',
  'Trabajo',
]

// Cargar categorías personalizadas desde localStorage
const loadCustomCategories = () => {
  try {
    const saved = localStorage.getItem('custom_categories')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveCustomCategories = (cats: string[]) => {
  try {
    localStorage.setItem('custom_categories', JSON.stringify(cats))
  } catch (error) {
    console.error('Error saving categories:', error)
  }
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('Sin clasificar')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showMoveCategoryModal, setShowMoveCategoryModal] = useState(false)
  const [targetCategory, setTargetCategory] = useState('')
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categories, setCategories] = useState<string[]>([
  ...DEFAULT_CATEGORIES,
  ...loadCustomCategories()
])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [tempTags, setTempTags] = useState('')
  const [tabBarHeight, setTabBarHeight] = useState(50) // vh
  const [searchInDoc, setSearchInDoc] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const [searchMatches, setSearchMatches] = useState<number[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [selectedCategoryDocs, setSelectedCategoryDocs] = useState<Set<string>>(new Set())
  
  const handleMouseDown = () => {
  setIsResizing(true)
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing) return
  const newHeight = ((window.innerHeight - e.clientY) / window.innerHeight) * 100
  setTabBarHeight(Math.min(Math.max(newHeight, 20), 80)) // Entre 20% y 80%
}

const handleMouseUp = () => {
  setIsResizing(false)
}

useEffect(() => {
  if (isResizing) {
    window.addEventListener('mousemove', handleMouseMove as any)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }
}, [isResizing])

  // Reemplazados: Tabs en lugar de modal de vista
  const [openTabs, setOpenTabs] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const docsPerPage = 10

  const API_URL = 'http://localhost:8001/api/v1'

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
  try {
    const res = await fetch(`${API_URL}/documents`)
    const data = await res.json()
    
    // Los documentos vienen truncados, necesitamos el texto completo
    const fullDocs = await Promise.all(
      (data.documents || []).map(async (doc: Document) => {
        // Si el texto está truncado (termina en "..."), no hacer nada
        // El texto completo ya está en LanceDB
        return doc
      })
    )
    
    setDocuments(fullDocs)
  } catch (error) {
    console.error('Error:', error)
  }
}

useEffect(() => {
  if (!searchInDoc || !activeTab) {
    setSearchMatches([])
    return
  }
  
  const activeDoc = openTabs.find(t => t.id === activeTab)
  if (!activeDoc) return
  
  const regex = new RegExp(searchInDoc, 'gi')
  const matches: number[] = []
  let match
  
  while ((match = regex.exec(activeDoc.text)) !== null) {
    matches.push(match.index)
  }
  
  setSearchMatches(matches)
  setCurrentMatchIndex(0)
}, [searchInDoc, activeTab, openTabs])

const scrollToMatch = (index: number) => {
  if (searchMatches.length === 0) return
  setCurrentMatchIndex(index)
  
  setTimeout(() => {
    const marks = document.querySelectorAll('.tab-content .active mark')
    if (marks[index]) {
      marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 100)
}

const sampleText = (text: string, maxChars: number = 3000): string => {
  if (text.length <= maxChars) return text
  
  const chunkSize = Math.floor(maxChars / 3)
  const start = text.slice(0, chunkSize)
  const middle = text.slice(Math.floor(text.length / 2) - Math.floor(chunkSize / 2), Math.floor(text.length / 2) + Math.floor(chunkSize / 2))
  const end = text.slice(text.length - chunkSize)
  
  return `${start}\n...\n${middle}\n...\n${end}`
}

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    let uploaded = 0

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append('file', files[i])

      try {
        await fetch(`${API_URL}/documents/upload`, {
          method: 'POST',
          body: formData,
        })
        uploaded++
      } catch (error) {
        console.error(`Error:`, error)
      }
    }

    setLoading(false)
    alert(`${uploaded} de ${files.length} archivos procesados`)
    loadDocuments()
    e.target.value = ''
  }

  const handleDownloadSelected = () => {
  if (selectedDocs.size === 0) {
    alert('Selecciona al menos un documento')
    return
  }
  
  const selectedDocuments = documents.filter(d => selectedDocs.has(d.id))
  const content = selectedDocuments.map(d => 
    `🚧 === ${d.metadata?.filename} ===\n\n${d.text}\n\n`
  ).join('\n')
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `documentos_seleccionados_${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  alert(`${selectedDocs.size} documentos descargados`)
}

  const handleDelete = async () => {
    if (selectedDocs.size === 0) {
      alert('Selecciona al menos un documento')
      return
    }

    if (!confirm(`¿Eliminar ${selectedDocs.size} documentos?`)) return

    setLoading(true)
    for (const id of selectedDocs) {
      try {
        await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' })
      } catch (error) {
        console.error('Error:', error)
      }
    }
    setLoading(false)
    setSelectedDocs(new Set())
    loadDocuments()
  }

  // 1) handleAutoTag (implementación real con Ollama)
const handleAutoTag = async () => {
  if (selectedDocs.size === 0) {
    alert('Selecciona al menos un documento')
    return
  }
  
  setLoading(true)
  setIsProcessing(true)
  setProcessingProgress(0)

  const totalDocs = selectedDocs.size
  let processed = 0
  const updatedDocs = [...documents] // Copia del array
  
  for (const docId of selectedDocs) {
    const docIndex = updatedDocs.findIndex(d => d.id === docId)
    if (docIndex === -1) continue
    
    const doc = updatedDocs[docIndex]
    
    try {
      const res = await fetch(`${API_URL}/ollama/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: `Analiza el siguiente texto y genera etiquetas descriptivas tipo titular.

REGLAS:
- Cada etiqueta debe tener 3-6 palabras (frases cortas, no palabras sueltas)
- Condensar el propósito o acción principal
- Si hay múltiples temáticas, hacer una línea por temática
- Si hay muchos enlaces/URLs, agruparlos por tema
- Si el contenido es variado sin tema claro, usar: "enlaces varios / recursos útiles"
- Nombres de personas mencionadas y PII Sensible

TEXTO A ANALIZAR:
"${sampleText(doc.text)}"

Responde ÚNICAMENTE con las etiquetas separadas por comas, sin números ni explicaciones.`
  }),
})
      
      const data = await res.json()
      const tags = data.response
        .replace(/^\d+\.\s*/gm, '') // Quitar numeración
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean)
        .slice(0, 5)
      
      // Actualizar en el array de copia
      updatedDocs[docIndex] = {
        ...doc,
        metadata: { ...doc.metadata, tags }
      }
      
      // Persistir en backend inmediatamente
      try {
        await fetch(`${API_URL}/documents/${docId}/metadata`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: docId, 
            metadata: { ...doc.metadata, tags }
          }),
        })
      } catch (metaError) {
        console.error('Error persisting metadata:', metaError)
      }

      processed++
      setProcessingProgress(Math.round((processed / totalDocs) * 100))
      
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  // Actualizar estado UNA SOLA VEZ al final
  setDocuments(updatedDocs)
  setLoading(false)
  setIsProcessing(false)
  setProcessingProgress(0)
  alert(`${selectedDocs.size} documentos etiquetados`)
}

  // 2) handleQuery con contexto real
  const handleQuery = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResponse('Procesando...')

    try {
      // Si hay documentos seleccionados, usar solo esos
      if (selectedDocs.size > 0) {
        const selectedTexts = documents
          .filter(d => selectedDocs.has(d.id))
          .map(d => d.text)
          .join('\n\n---\n\n')

        const res = await fetch(`${API_URL}/ollama/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Contexto de documentos seleccionados:

${selectedTexts.substring(0, 3000)}

Pregunta del usuario: ${query}

Responde basándote SOLO en el contexto proporcionado.`
          }),
        })

        const data = await res.json()
        setResponse(data.response || 'Sin respuesta')
      } else {
        // Si no hay selección, usar RAG completo
        const res = await fetch(`${API_URL}/rag/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5 }),
        })
        const data = await res.json()
        setResponse(data.response || 'Sin respuesta')
      }
    } catch (error) {
      setResponse('Error al consultar')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCategory = () => {
    if (selectedDocs.size === 0) {
      alert('Selecciona al menos un documento')
      return
    }
    setShowCategoryModal(true)
  }

  const confirmAssignCategory = async () => {
  const docsToUpdate = Array.from(selectedDocs)
  
  const updatedDocs = documents.map((doc) =>
    selectedDocs.has(doc.id)
      ? { ...doc, metadata: { ...doc.metadata, category: selectedCategory } }
      : doc
  )
  setDocuments(updatedDocs)
  
  // Persistir en backend
  let successCount = 0
  for (const docId of docsToUpdate) {
    const doc = updatedDocs.find(d => d.id === docId)
    if (doc) {
      try {
        await fetch(`${API_URL}/documents/${docId}/metadata`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: docId, metadata: doc.metadata }),
        })
        successCount++
      } catch (error) {
        console.error(`Error updating ${docId}:`, error)
      }
    }
  }
  
  alert(`${successCount} de ${docsToUpdate.length} docs asignados a "${selectedCategory}"`)
  setShowCategoryModal(false)
  setSelectedDocs(new Set())
}

  const handleAddCategory = () => {
  if (!newCategoryName.trim()) return
  if (categories.includes(newCategoryName)) {
    alert('Esta categoría ya existe')
    return
  }
  
  const newCategories = [...categories, newCategoryName]
  setCategories(newCategories)
  
  // Guardar en localStorage
  const customCats = newCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))
  saveCustomCategories(customCats)
  
  setNewCategoryName('')
  setShowNewCategoryModal(false)
}

const handleDeleteCategories = async () => {
  if (selectedCategories.size === 0) return
  
  const categoriesToDelete = Array.from(selectedCategories)
  const cannotDelete = categoriesToDelete.filter(c => DEFAULT_CATEGORIES.includes(c))
  
  if (cannotDelete.length > 0) {
    alert(`No se pueden eliminar las categorías por defecto: ${cannotDelete.join(', ')}`)
    return
  }
  
  if (!confirm(`¿Eliminar ${categoriesToDelete.length} categorías? Los documentos se moverán a "Sin clasificar"`)) {
    return
  }
  
  // Mover documentos a "Sin clasificar"
  const updatedDocs = documents.map(doc => 
    categoriesToDelete.includes(doc.metadata?.category || '')
      ? { ...doc, metadata: { ...doc.metadata, category: 'Sin clasificar' } }
      : doc
  )
  setDocuments(updatedDocs)
  
  // Persistir cambios
  for (const doc of updatedDocs.filter(d => categoriesToDelete.includes(d.metadata?.category || ''))) {
    try {
      await fetch(`${API_URL}/documents/${doc.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, metadata: doc.metadata }),
      })
    } catch (error) {
      console.error('Error updating doc:', error)
    }
  }
  
  // Eliminar categorías
  const newCategories = categories.filter(c => !categoriesToDelete.includes(c))
  setCategories(newCategories)
  
  const customCats = newCategories.filter(c => !DEFAULT_CATEGORIES.includes(c))
  saveCustomCategories(customCats)
  
  setSelectedCategories(new Set())
  alert('Categorías eliminadas')
}

const handleMoveDocuments = async () => {
  if (selectedCategoryDocs.size === 0 || !targetCategory) return
  
  const docsToMove = Array.from(selectedCategoryDocs)
  
  const updatedDocs = documents.map(doc =>
    docsToMove.includes(doc.id)
      ? { ...doc, metadata: { ...doc.metadata, category: targetCategory } }
      : doc
  )
  setDocuments(updatedDocs)
  
  // Persistir cambios
  for (const docId of docsToMove) {
    const doc = updatedDocs.find(d => d.id === docId)
    if (doc) {
      try {
        await fetch(`${API_URL}/documents/${docId}/metadata`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: docId, metadata: doc.metadata }),
        })
      } catch (error) {
        console.error('Error:', error)
      }
    }
  }
  
  setShowMoveCategoryModal(false)
  setSelectedCategoryDocs(new Set())
  alert(`${docsToMove.length} documentos movidos a "${targetCategory}"`)
}

  const toggleCategory = (cat: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(cat)) {
      newExpanded.delete(cat)
    } else {
      newExpanded.add(cat)
    }
    setExpandedCategories(newExpanded)
  }

  const handleEditTags = (doc: Document) => {
    setEditingTags(doc.id)
    setTempTags((doc.metadata?.tags || []).join(', '))
  }

  const saveTags = async (docId: string) => {
  const tags = tempTags.split(',').map(t => t.trim()).filter(Boolean)
  const doc = documents.find(d => d.id === docId)
  
  if (!doc) return
  
  const updatedMetadata = { ...doc.metadata, tags }
  
  const updatedDocs = documents.map((d) =>
    d.id === docId
      ? { ...d, metadata: updatedMetadata }
      : d
  )
  setDocuments(updatedDocs)
  
  // Persistir en backend
  try {
    await fetch(`${API_URL}/documents/${docId}/metadata`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: docId, metadata: updatedMetadata }),
    })
  } catch (error) {
    console.error('Error saving tags:', error)
    alert('Error al guardar tags')
  }
  
  setEditingTags(null)
  setTempTags('')
}

  // 4) handleExportCategory: implementación real (descarga .txt)
  const handleExportCategory = async (category: string) => {
  const docs = documents.filter(d => (d.metadata?.category || 'Sin clasificar') === category)
  
  if (docs.length === 0) {
    alert('No hay documentos en esta categoría')
    return
  }
  
  const zip = new JSZip()
  
  // Crear carpeta de categoría
  const categoryFolder = zip.folder(category)
  
  // Agregar documentos individuales a la carpeta
  docs.forEach(doc => {
    const filename = doc.metadata?.filename || `${doc.id}.txt`
    categoryFolder?.file(filename, doc.text)
  })
  
  // Crear archivo unificado en la raíz del ZIP
  const unified = docs.map(d => 
    `🚧 === ${d.metadata?.filename} ===\n\n${d.text}\n\n`
  ).join('\n')
  
  zip.file(`${category}_unificado.txt`, unified)
  
  // Generar y descargar ZIP
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${category}_${Date.now()}.zip`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  alert(`Categoría "${category}" exportada (${docs.length} documentos)`)
}

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDocs(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedDocs.size === visibleDocs.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(visibleDocs.map((d) => d.id)))
    }
  }

  const totalPages = Math.ceil(documents.length / docsPerPage)
  const startIdx = (currentPage - 1) * docsPerPage
  const visibleDocs = documents.slice(startIdx, startIdx + docsPerPage)

  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: documents.filter((d) => (d.metadata?.category || 'Sin clasificar') === cat).length,
    docs: documents.filter((d) => (d.metadata?.category || 'Sin clasificar') === cat),
  }))

  // 3) Funciones de Tabs
  const handleViewDocument = (doc: Document) => {
    // Si ya está abierto, solo activarlo
    if (openTabs.find(t => t.id === doc.id)) {
      setActiveTab(doc.id)
      return
    }

    // Agregar nueva tab
    setOpenTabs([...openTabs, doc])
    setActiveTab(doc.id)
  }

  const closeTab = (docId: string) => {
    const newTabs = openTabs.filter(t => t.id !== docId)
    setOpenTabs(newTabs)

    if (activeTab === docId) {
      setActiveTab(newTabs.length > 0 ? newTabs[0].id : null)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Organizatext (Local)</h1>
      </header>

      <div className="dashboard">
        {/* Columna Izquierda */}
        <div className="left-column">
          {/* Upload */}
          <section className="card">
            <label className="upload-label">
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.md"
                onChange={handleUpload}
                disabled={loading}
                className="upload-input"
              />
              <span className="btn-upload">Cargar tus archivos</span>
            </label>
            <p className="file-types">PDF · TXT · DOCX · MD</p>

            {/* Botón Etiquetar */}
            <button
              onClick={handleAutoTag}
              className="btn-auto-tag"
              disabled={selectedDocs.size === 0 || loading}
            >
              Etiquetar Textos / Extraer Keywords
            </button>
          </section>

          {isProcessing && (
  <div className="progress-container">
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${processingProgress}%` }} />
    </div>
    <span className="progress-text">{processingProgress}% completado</span>
  </div>
)}

          {/* Documentos */}
          <section className="card">
            <div className="card-header">
              <h3>Documentos Procesados ({documents.length})</h3>
              <div className="header-actions">
                <button onClick={loadDocuments} className="btn-icon" title="Actualizar">
                  ↻
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-icon btn-danger"
                  disabled={selectedDocs.size === 0}
                  title="Eliminar seleccionados"
                >
                  🗑
                </button>
                <button
  onClick={handleDownloadSelected}
  className="btn-icon"
  disabled={selectedDocs.size === 0}
  title="Descargar seleccionados"
>
  ⬇
</button>
              </div>
            </div>

            {visibleDocs.length > 0 ? (
              <>
                <div className="doc-actions">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedDocs.size === visibleDocs.length && visibleDocs.length > 0}
                      onChange={toggleSelectAll}
                    />
                    <span>Seleccionar todos</span>
                  </label>
                  <button
                    onClick={handleAssignCategory}
                    className="btn-assign-category"
                    disabled={selectedDocs.size === 0}
                  >
                    Indexar
                  </button>
                </div>

                <div className="doc-list">
                  {visibleDocs.map((doc) => (
                    <div key={doc.id} className="doc-item-expanded">
                      <div className="doc-row-main">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleSelection(doc.id)}
                        />
                        <div className="doc-info-expanded">
                          <span className="doc-name">{doc.metadata?.filename || doc.id}</span>
                          <span className="doc-meta">
                            {doc.metadata?.word_count || 0} palabras
                            {doc.metadata?.category && ` · ${doc.metadata.category}`}
                          </span>
                        </div>
                        <div className="doc-actions-inline">
                          <button
                            className="btn-mini"
                            onClick={() => handleViewDocument(doc)}
                          >
                            Ver
                          </button>
                          <button
                            className="btn-mini"
                            onClick={() => handleEditTags(doc)}
                          >
                            Anotar
                          </button>
                        </div>
                      </div>

                      {/* Tags inline */}
                      {editingTags === doc.id ? (
                        <div className="tags-edit">
                          <input
                            type="text"
                            value={tempTags}
                            onChange={(e) => setTempTags(e.target.value)}
                            placeholder="tag1, tag2, tag3"
                            className="tags-input"
                          />
                          <button onClick={() => saveTags(doc.id)} className="btn-mini">Guardar</button>
                          <button onClick={() => setEditingTags(null)} className="btn-mini">Cancelar</button>
                        </div>
                      ) : doc.metadata?.tags && doc.metadata.tags.length > 0 ? (
                        <div className="tags-display">
                          {doc.metadata.tags.map((tag, i) => (
                            <span key={i} className="tag">{tag}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* 10) Paginación con Next (reemplazada) */}
                {totalPages > 1 && (
                  <div className="pagination">
                    {currentPage > 1 && (
                      <button onClick={() => setCurrentPage(currentPage - 1)} className="page-btn">
                        ←
                      </button>
                    )}

                    {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`page-btn ${page === currentPage ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    ))}

                    {totalPages > 9 && currentPage < totalPages - 4 && (
                      <>
                        <span className="page-ellipsis">...</span>
                        <button onClick={() => setCurrentPage(totalPages)} className="page-btn">
                          {totalPages}
                        </button>
                      </>
                    )}

                    {currentPage < totalPages && (
                      <button onClick={() => setCurrentPage(currentPage + 1)} className="page-btn">
                        →
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="empty-state">No hay documentos</p>
            )}
          </section>

          {/* Búsqueda */}
          <section className="card">
            <h3>Buscar o preguntar</h3>
            {selectedDocs.size > 0 && (
              <p className="context-info">
                Contexto: {selectedDocs.size} documento(s) seleccionado(s)
              </p>
            )}
            <div className="search-box">
              <input
                type="text"
                placeholder="¿Qué necesitas encontrar?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleQuery()}
                disabled={loading}
              />
              <button
                onClick={handleQuery}
                disabled={loading || !query.trim()}
                className="btn-search"
              >
                {loading ? 'Procesando...' : 'Enviar'}
              </button>
            </div>

            {response && (
              <div className="response-box">
                <strong>Respuesta:</strong>
                <p>{response}</p>
              </div>
            )}
          </section>
        </div>

        {/* Columna Derecha */}
        <div className="right-column">
          {/* Categorías */}
          <section className="card">
            <div className="card-header">
  <h3>Categorías</h3>
  <div className="header-actions">
    <button 
      onClick={() => setShowMoveCategoryModal(true)}
      className="btn-icon"
      disabled={selectedCategoryDocs.size === 0}
      title="Mover documentos a otra categoría"
    >
      ➜
    </button>
    <button 
      onClick={handleDeleteCategories}
      className="btn-icon btn-danger"
      disabled={selectedCategories.size === 0}
      title="Eliminar categorías seleccionadas"
    >
      🗑
    </button>
    <button 
      onClick={() => setShowNewCategoryModal(true)} 
      className="btn-icon"
      title="Nueva categoría"
    >
      +
    </button>
  </div>
</div>
            <div className="category-list">
              {categoryCounts.map((cat) => (
                <div key={cat.name}>
                  <div className="category-item-with-checkbox">
  <input
    type="checkbox"
    checked={selectedCategories.has(cat.name)}
    onChange={(e) => {
      e.stopPropagation()
      const newSelected = new Set(selectedCategories)
      if (newSelected.has(cat.name)) {
        newSelected.delete(cat.name)
      } else {
        newSelected.add(cat.name)
      }
      setSelectedCategories(newSelected)
    }}
    className="category-checkbox"
  />
  <div className="category-item" onClick={() => toggleCategory(cat.name)}>
    <span className="category-icon">
      {expandedCategories.has(cat.name) ? '▼' : '▸'}
    </span>
    <span className="category-name">{cat.name}</span>
    <span className="category-count">{cat.count}</span>
    <button
      className="btn-icon-sm"
      onClick={(e) => {
        e.stopPropagation()
        handleExportCategory(cat.name)
      }}
      title="Exportar"
    >
      ⬇
    </button>
  </div>
</div>

                  {expandedCategories.has(cat.name) && cat.docs.length > 0 && (
  <div className="category-docs">
    {cat.docs.map((doc) => (
      <div key={doc.id} className="category-doc-item-expanded">
        <input
          type="checkbox"
          checked={selectedCategoryDocs.has(doc.id)}
          onChange={() => {
            const newSelected = new Set(selectedCategoryDocs)
            if (newSelected.has(doc.id)) {
              newSelected.delete(doc.id)
            } else {
              newSelected.add(doc.id)
            }
            setSelectedCategoryDocs(newSelected)
          }}
          className="category-doc-checkbox"
        />
        <span className="category-doc-name">
          {doc.metadata?.filename || doc.id}
        </span>
        <button
          className="btn-mini"
          onClick={() => handleViewDocument(doc)}
        >
          Ver
        </button>
      </div>
    ))}
  </div>
)}
                </div>
              ))}
            </div>

            <button 
  className="btn-export-all"
  disabled={selectedCategories.size === 0 && selectedDocs.size === 0}
  onClick={async () => {
    if (selectedCategories.size > 0) {
      // Exportar múltiples categorías en un solo ZIP
      const zip = new JSZip()
      
      for (const catName of selectedCategories) {
        const docs = documents.filter(d => (d.metadata?.category || 'Sin clasificar') === catName)
        
        if (docs.length > 0) {
          const categoryFolder = zip.folder(catName)
          
          docs.forEach(doc => {
            const filename = doc.metadata?.filename || `${doc.id}.txt`
            categoryFolder?.file(filename, doc.text)
          })
          
          // Unificado por categoría
          const unified = docs.map(d => 
            `🚧 === ${d.metadata?.filename} ===\n\n${d.text}\n\n`
          ).join('\n')
          
          zip.file(`${catName}_unificado.txt`, unified)
        }
      }
      
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `categorias_${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert(`${selectedCategories.size} categorías exportadas`)
      setSelectedCategories(new Set())
      
    } else if (selectedDocs.size > 0) {
      handleDownloadSelected()
    }
  }}
>
  Guardar / Exportar Selección
</button>
          </section>

          {/* Stats */}
          <section className="card stats">
            <h3>Estadísticas</h3>
            <div className="stat-row">
              <span>Total documentos:</span>
              <strong>{documents.length}</strong>
            </div>
            <div className="stat-row">
              <span>Seleccionados:</span>
              <strong>{selectedDocs.size}</strong>
            </div>
            <div className="stat-row">
              <span>Palabras totales:</span>
              <strong>{documents.reduce((sum, d) => sum + (d.metadata?.word_count || 0), 0)}</strong>
            </div>
          </section>
        </div>
      </div>

      {/* Modal Categorías */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Asignar a Categoría</h3>
            <p>{selectedDocs.size} documentos seleccionados</p>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={confirmAssignCategory} className="btn-primary">
                Asignar
              </button>
              <button onClick={() => setShowCategoryModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Categoría */}
      {showNewCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowNewCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Categoría</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nombre de la categoría"
              className="modal-input"
            />
            <div className="modal-actions">
              <button onClick={handleAddCategory} className="btn-primary">
                Crear
              </button>
              <button onClick={() => setShowNewCategoryModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mover Documentos */}
{showMoveCategoryModal && (
  <div className="modal-overlay" onClick={() => setShowMoveCategoryModal(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h3>Mover Documentos</h3>
      <p>{selectedCategoryDocs.size} documentos seleccionados</p>
      <select 
        value={targetCategory} 
        onChange={(e) => setTargetCategory(e.target.value)}
        className="modal-select"
      >
        <option value="">Seleccionar categoría destino</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <div className="modal-actions">
        <button onClick={handleMoveDocuments} className="btn-primary" disabled={!targetCategory}>
          Mover
        </button>
        <button onClick={() => setShowMoveCategoryModal(false)} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

      {/* 8) TabBar y Viewer */}
      {openTabs.length > 0 && (
  <div className="tab-viewer" style={{ height: `${tabBarHeight}vh` }}>
    <div 
      className="resize-handle" 
      onMouseDown={handleMouseDown}
      title="Arrastrar para redimensionar"
    >
      <span className="resize-icon">↕</span>
    </div>
    
    <div className="tab-bar">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-title">{tab.metadata?.filename || tab.id}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            ×
          </button>
        </div>
      ))}
      
      {/* Búsqueda en documento */}
      <div className="tab-search">
  <input
    type="text"
    placeholder="Buscar en documento (Ctrl+F)"
    value={searchInDoc}
    onChange={(e) => {
      setSearchInDoc(e.target.value)
      setCurrentMatchIndex(0)
    }}
    className="tab-search-input"
  />
  {searchInDoc && (
    <div className="search-controls">
      {searchMatches.length > 0 ? (
        <>
          <span className="search-count">
            {currentMatchIndex + 1}/{searchMatches.length}
          </span>
          <button 
            className="search-nav-btn"
            onClick={() => scrollToMatch(Math.max(0, currentMatchIndex - 1))}
            disabled={currentMatchIndex === 0}
          >
            ↑
          </button>
          <button 
            className="search-nav-btn"
            onClick={() => scrollToMatch(Math.min(searchMatches.length - 1, currentMatchIndex + 1))}
            disabled={currentMatchIndex === searchMatches.length - 1}
          >
            ↓
          </button>
        </>
      ) : (
        <span className="search-no-results">No encontrado</span>
      )}
    </div>
  )}
</div>
    </div>
    
    <div className="tab-content">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab-pane ${activeTab === tab.id ? 'active' : ''}`}
        >
          <div className="doc-viewer-readonly">
            <pre>
  {activeTab === tab.id && searchInDoc 
    ? tab.text.split(new RegExp(`(${searchInDoc})`, 'gi')).map((part, i) => 
        part.toLowerCase() === searchInDoc.toLowerCase() 
          ? <mark key={i}>{part}</mark>
          : part
      )
    : tab.text
  }
</pre>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  )
}

export default App
