// local/backend/cmd/main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"organizatext-local/pkg/lancedb"
	"organizatext-local/pkg/ollama"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

var (
	ollamaClient  *ollama.Client
	lancedbClient *lancedb.Client
)

func main() {
	// Cargar .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No se encontró archivo .env, usando valores por defecto")
	}

	// Inicializar clientes
	// Establecer directorio de trabajo al lado del ejecutable
	// Obtener directorio real del ejecutable
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	exeDir, _ = filepath.EvalSymlinks(exeDir)
	os.Chdir(exeDir)
	log.Println("✓ Directorio de trabajo:", exeDir)
	ollamaClient = ollama.NewClient()
	log.Printf("✓ Cliente Ollama configurado: %s (modelo: %s)\n", ollamaClient.BaseURL, ollamaClient.Model)

	lancedbClient = lancedb.NewClient()
	log.Printf("✓ Cliente LanceDB configurado: %s\n", lancedbClient.DBPath)

	// Verificar conexiones
	if ollamaClient.IsHealthy() {
		log.Println("✓ Ollama está corriendo correctamente")
	} else {
		log.Println("⚠️  Ollama no responde")
	}

	if lancedbClient.IsHealthy() {
		log.Println("✓ LanceDB está disponible")
	} else {
		log.Println("⚠️  LanceDB no está disponible")
	}

	// Configurar Fiber
	app := fiber.New(fiber.Config{
		AppName: "Organizatext Local v1.0",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Rutas
	setupRoutes(app)

	// Puerto
	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("✓ Servidor corriendo en http://localhost:%s\n", port)
	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}

func setupRoutes(app *fiber.App) {
	// Ruta raíz con UI básica
	app.Get("/", func(c *fiber.Ctx) error {
		html := `
<!DOCTYPE html>
<html>
<head>
    <title>Organizatext Local API</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #2563eb; }
        .endpoint { background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .method { color: #059669; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🚀 Organizatext Local API</h1>
    <p>Backend corriendo correctamente en <strong>http://localhost:8001</strong></p>
    
    <h2>Endpoints disponibles:</h2>
    
    <div class="endpoint">
        <span class="method">POST</span> /api/v1/documents/upload - Subir documento
    </div>
    <div class="endpoint">
        <span class="method">GET</span> /api/v1/documents - Listar documentos
    </div>
    <div class="endpoint">
        <span class="method">DELETE</span> /api/v1/documents/:id - Eliminar documento
    </div>
    <div class="endpoint">
        <span class="method">POST</span> /api/v1/rag/query - Query RAG
    </div>
    <div class="endpoint">
        <span class="method">GET</span> /health - Health check
    </div>
    
    <p><a href="/health">Ver health check →</a></p>
</body>
</html>
		`
		c.Type("html")
		return c.SendString(html)
	})

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "organizatext-local",
			"ollama":  ollamaClient.IsHealthy(),
			"lancedb": lancedbClient.IsHealthy(),
		})
	})

	// API v1
	api := app.Group("/api/v1")

	// Rutas de documentos
	api.Post("/documents/upload", handleUpload)
	api.Get("/documents", handleListDocuments)
	api.Delete("/documents/:id", handleDeleteDocument)
	api.Put("/documents/:id/metadata", handleUpdateMetadata)

	// Rutas de Ollama
	api.Post("/ollama/query", handleOllamaQuery)
	api.Get("/ollama/models", handleOllamaModels)

	// Rutas de LanceDB (vector search)
	api.Post("/vectordb/add", handleVectorAdd)
	api.Post("/vectordb/search", handleVectorSearch)
	api.Get("/vectordb/stats", handleVectorStats)

	// Ruta de RAG (combinado: search + ollama)
	api.Post("/rag/query", handleRAGQuery)
}

// ============================================
// Handlers existentes (Ollama, Documents)
// ============================================

func handleUpload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("ERROR: No file in request: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "No file provided"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".docx" && ext != ".md" && ext != ".txt" {
		log.Printf("ERROR: Invalid file type: %s", ext)
		return c.Status(400).JSON(fiber.Map{"error": "Only PDF, DOCX, MD, and TXT files are supported"})
	}

	uploadDir := "./data/uploads"
	os.MkdirAll(uploadDir, 0755)

	tempPath := filepath.Join(uploadDir, file.Filename)
	if err := c.SaveFile(file, tempPath); err != nil {
		log.Printf("ERROR: Failed to save file: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save file"})
	}

	log.Printf("INFO: Processing file: %s", tempPath)

	// Procesar documento
	exePath, _ := os.Executable()
	exeDir, _ := filepath.EvalSymlinks(filepath.Dir(exePath))
	cmd := exec.Command("python", filepath.Join(exeDir, "scripts", "process_document.py"), tempPath)
	cmd.Stderr = os.Stderr // Mostrar errores de Python en consola
	output, err := cmd.Output()

	if err != nil {
		log.Printf("ERROR: Python script failed: %v, output: %s", err, string(output))
		return c.Status(500).JSON(fiber.Map{"error": "Failed to process document", "details": string(output)})
	}

	log.Printf("INFO: Python output: %s", string(output))

	var result struct {
		Filename  string `json:"filename"`
		Text      string `json:"text"`
		WordCount int    `json:"word_count"`
		Success   bool   `json:"success"`
		Error     string `json:"error"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		log.Printf("ERROR: Failed to parse JSON: %v, raw: %s", err, string(output))
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse processing result", "raw": string(output)})
	}

	if !result.Success {
		log.Printf("ERROR: Processing failed: %s", result.Error)
		return c.Status(500).JSON(fiber.Map{"error": result.Error})
	}

	docID := fmt.Sprintf("doc_%s_%d", strings.ReplaceAll(file.Filename, ".", "_"), time.Now().Unix())

	doc := lancedb.Document{
		ID:   docID,
		Text: result.Text,
		Metadata: map[string]interface{}{
			"filename":    file.Filename,
			"word_count":  result.WordCount,
			"uploaded_at": time.Now().Format(time.RFC3339),
		},
	}

	if err := lancedbClient.AddDocument(doc); err != nil {
		log.Printf("ERROR: Failed to add to LanceDB: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to add to vector database", "details": err.Error()})
	}

	log.Printf("SUCCESS: Document %s processed and stored", docID)

	return c.JSON(fiber.Map{
		"success":    true,
		"id":         docID,
		"filename":   file.Filename,
		"word_count": result.WordCount,
		"message":    "Document processed and added to vector database",
	})
}

func handleUpdateMetadata(c *fiber.Ctx) error {
	var req struct {
		ID       string                 `json:"id"`
		Metadata map[string]interface{} `json:"metadata"`
	}

	if err := c.BodyParser(&req); err != nil {
		log.Printf("ERROR: Failed to parse request: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	log.Printf("INFO: Updating metadata for %s: %+v", req.ID, req.Metadata)

	// Actualizar en LanceDB
	if err := lancedbClient.UpdateMetadata(req.ID, req.Metadata); err != nil {
		log.Printf("ERROR: Failed to update metadata: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	log.Printf("SUCCESS: Metadata updated for %s", req.ID)

	return c.JSON(fiber.Map{"success": true, "id": req.ID})
}

func handleListDocuments(c *fiber.Ctx) error {
	docs, err := lancedbClient.ListDocuments()
	if err != nil {
		log.Printf("ERROR: Failed to list documents: %v", err)
		// Si falla, retornar lista vacía en lugar de error
		return c.JSON(fiber.Map{"documents": []interface{}{}, "total": 0, "error": err.Error()})
	}
	return c.JSON(fiber.Map{"documents": docs, "total": len(docs)})
}

func handleDeleteDocument(c *fiber.Ctx) error {
	docID := c.Params("id")

	if docID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Document ID is required"})
	}

	if err := lancedbClient.DeleteDocument(docID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true, "id": docID, "message": "Document deleted"})
}

func handleOllamaQuery(c *fiber.Ctx) error {
	var req struct {
		Prompt string `json:"prompt"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Prompt == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Prompt is required"})
	}

	response, err := ollamaClient.Generate(req.Prompt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"prompt":   req.Prompt,
		"response": response,
		"model":    ollamaClient.Model,
	})
}

func handleOllamaModels(c *fiber.Ctx) error {
	models, err := ollamaClient.ListModels()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"models": models})
}

// ============================================
// Handlers nuevos (LanceDB)
// ============================================

func handleVectorAdd(c *fiber.Ctx) error {
	var req struct {
		ID       string                 `json:"id"`
		Text     string                 `json:"text"`
		Metadata map[string]interface{} `json:"metadata"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.ID == "" || req.Text == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ID and text are required"})
	}

	doc := lancedb.Document{
		ID:       req.ID,
		Text:     req.Text,
		Metadata: req.Metadata,
	}

	if err := lancedbClient.AddDocument(doc); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true, "id": req.ID})
}

func handleVectorSearch(c *fiber.Ctx) error {
	var req struct {
		Query string `json:"query"`
		Limit int    `json:"limit"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Query == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Query is required"})
	}

	if req.Limit <= 0 {
		req.Limit = 5
	}

	results, err := lancedbClient.Search(req.Query, req.Limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"results": results})
}

func handleVectorStats(c *fiber.Ctx) error {
	stats, err := lancedbClient.GetStats()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"stats": stats})
}

// ============================================
// Handler RAG (Vector Search + Ollama)
// ============================================

func handleRAGQuery(c *fiber.Ctx) error {
	var req struct {
		Query string `json:"query"`
		Limit int    `json:"limit"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if req.Query == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Query is required"})
	}

	if req.Limit <= 0 {
		req.Limit = 3
	}

	// 1. Buscar documentos relevantes
	results, err := lancedbClient.Search(req.Query, req.Limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// 2. Construir contexto
	context := "Contexto de documentos relevantes:\n\n"
	for i, result := range results {
		context += fmt.Sprintf("Documento %d:\n%s\n\n", i+1, result.Text)
	}

	// 3. Crear prompt con contexto
	prompt := fmt.Sprintf("%s\nPregunta del usuario: %s\n\nResponde basándote en el contexto proporcionado.", context, req.Query)

	// 4. Enviar a Ollama
	response, err := ollamaClient.Generate(prompt)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"query":    req.Query,
		"response": response,
		"context":  results,
		"model":    ollamaClient.Model,
	})
}
