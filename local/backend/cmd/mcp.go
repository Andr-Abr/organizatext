// local/backend/cmd/mcp.go
// Servidor MCP (Model Context Protocol) para Organizatext
// Expone herramientas que n8n puede usar via AI Agent
// NO modifica nada del main.go existente

package main

import (
	"github.com/gofiber/fiber/v2"
)

// setupMCPRoutes agrega las rutas MCP al servidor Fiber existente
// Se llama desde main.go después de setupRoutes(app)
func setupMCPRoutes(app *fiber.App) {

	mcp := app.Group("/mcp")

	// ─────────────────────────────────────────────
	// GET /mcp/tools
	// Lista las herramientas disponibles (el "menú" que lee n8n)
	// ─────────────────────────────────────────────
	mcp.Get("/tools", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"tools": []fiber.Map{
				{
					"name":        "get_documents",
					"description": "Obtiene la lista completa de documentos almacenados con su texto, tags y metadata. También devuelve todas las categorías existentes para que puedas asignar correctamente.",
					"inputSchema": fiber.Map{
						"type":       "object",
						"properties": fiber.Map{},
						"required":   []string{},
					},
				},
				{
					"name":        "update_category",
					"description": "Actualiza la categoría de un documento por su ID. Usa solo categorías que existan en la lista devuelta por get_documents.",
					"inputSchema": fiber.Map{
						"type": "object",
						"properties": fiber.Map{
							"id": fiber.Map{
								"type":        "string",
								"description": "El ID único del documento a actualizar",
							},
							"category": fiber.Map{
								"type":        "string",
								"description": "La categoría a asignar. Debe ser una de las categorías existentes devueltas por get_documents. Si ninguna encaja, usar 'Sin clasificar'.",
							},
							"reason": fiber.Map{
								"type":        "string",
								"description": "Explicación breve de por qué se asignó esa categoría",
							},
						},
						"required": []string{"id", "category"},
					},
				},
			},
		})
	})

	// ─────────────────────────────────────────────
	// POST /mcp/tools/call
	// Ejecuta una herramienta
	// ─────────────────────────────────────────────
	mcp.Post("/tools/call", func(c *fiber.Ctx) error {

		var req struct {
			Name  string                 `json:"name"`
			Input map[string]interface{} `json:"input"`
		}

		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Cuerpo de la petición inválido",
			})
		}

		switch req.Name {

		// ── Herramienta 1: get_documents ──────────────
		case "get_documents":
			docs, err := lancedbClient.ListDocuments()
			if err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error": "Error obteniendo documentos: " + err.Error(),
				})
			}

			// Leer categorías únicas que ya existen en los documentos
			// También leer los tags como candidatos a categoría
			// Siempre incluir "Sin clasificar" como opción base
			// Categorías predeterminadas siempre disponibles
			defaultCategories := []string{
				"Sin clasificar", "Proyectos", "Ideas", "Investigación",
				"Finanzas", "Personal", "Trabajo",
			}
			categorySet := map[string]bool{}
			for _, cat := range defaultCategories {
				categorySet[cat] = true
			}
			// Más las categorías personalizadas ya asignadas en documentos
			for _, doc := range docs {
				if doc.Metadata != nil {
					if cat, ok := doc.Metadata["category"].(string); ok && cat != "" && cat != "Sin clasificar" {
						categorySet[cat] = true
					}
				}
			}

			// Convertir el set a lista
			existingCategories := []string{}
			for cat := range categorySet {
				existingCategories = append(existingCategories, cat)
			}

			return c.JSON(fiber.Map{
				"tool":                "get_documents",
				"result":              docs,
				"total":               len(docs),
				"existing_categories": existingCategories,
			})

		// ── Herramienta 2: update_category ────────────
		case "update_category":
			id, ok := req.Input["id"].(string)
			if !ok || id == "" {
				return c.Status(400).JSON(fiber.Map{
					"error": "El campo 'id' es requerido y debe ser string",
				})
			}

			category, ok := req.Input["category"].(string)
			if !ok || category == "" {
				return c.Status(400).JSON(fiber.Map{
					"error": "El campo 'category' es requerido y debe ser string",
				})
			}

			reason, _ := req.Input["reason"].(string)

			// Buscar el documento actual para preservar sus datos existentes
			existingDocs, err := lancedbClient.ListDocuments()
			if err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error": "Error obteniendo documento actual: " + err.Error(),
				})
			}

			// Encontrar el documento por ID y copiar su metadata existente
			var existingMetadata map[string]interface{}
			for _, doc := range existingDocs {
				if doc.ID == id {
					existingMetadata = doc.Metadata
					break
				}
			}

			if existingMetadata == nil {
				existingMetadata = map[string]interface{}{}
			}

			// Actualizar solo la categoría, preservando todo lo demás (tags, filename, etc.)
			existingMetadata["category"] = category
			existingMetadata["categorized_by"] = "llm_mcp"
			existingMetadata["categorization_reason"] = reason

			if err := lancedbClient.UpdateMetadata(id, existingMetadata); err != nil {
				return c.Status(500).JSON(fiber.Map{
					"error": "Error actualizando metadata: " + err.Error(),
				})
			}

			return c.JSON(fiber.Map{
				"tool":     "update_category",
				"success":  true,
				"id":       id,
				"category": category,
				"reason":   reason,
			})

		// ── Herramienta desconocida ────────────────────
		default:
			return c.Status(404).JSON(fiber.Map{
				"error": "Herramienta desconocida: " + req.Name,
			})
		}
	})
}
