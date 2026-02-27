// local/backend/pkg/lancedb/client.go
// Cliente para LanceDB (vector store local)

package lancedb

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

type Client struct {
	DBPath string
	Table  string
}

type Document struct {
	ID       string                 `json:"id"`
	Text     string                 `json:"text"`
	Metadata map[string]interface{} `json:"metadata"`
}

type SearchResult struct {
	ID       string                 `json:"id"`
	Distance float64                `json:"distance"`
	Text     string                 `json:"text"`
	Metadata map[string]interface{} `json:"metadata"`
}

// NewClient crea un nuevo cliente de LanceDB
func NewClient() *Client {
	dbPath := os.Getenv("LANCEDB_PATH")
	if dbPath == "" {
		dbPath = "./data/lancedb"
	}

	table := os.Getenv("LANCEDB_TABLE")
	if table == "" {
		table = "documents"
	}

	return &Client{
		DBPath: dbPath,
		Table:  table,
	}
}

// AddDocument agrega un documento usando script Python
func (c *Client) AddDocument(doc Document) error {
	metadataJSON, _ := json.Marshal(doc.Metadata)

	// Escribir texto a archivo temporal para evitar límite de argumentos de Windows
	tmpFile, err := os.CreateTemp("", "lancedb_add_*.txt")
	if err != nil {
		return fmt.Errorf("error creating temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.WriteString(doc.Text)
	tmpFile.Close()

	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_add.py"), doc.ID, "--file", tmpFile.Name(), string(metadataJSON))

	// Redirigir stderr a null para eliminar warnings
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("error adding document: %s - %w", string(output), err)
	}
	return nil
}

// Search busca documentos similares
func (c *Client) Search(query string, limit int) ([]SearchResult, error) {
	if limit <= 0 {
		limit = 5
	}

	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_search.py"), query, fmt.Sprintf("%d", limit))

	// Redirigir stderr a null para eliminar warnings
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("error searching: %w", err)
	}

	var results []SearchResult
	if err := json.Unmarshal(output, &results); err != nil {
		return nil, fmt.Errorf("error parsing results: %w", err)
	}

	return results, nil
}

// Helper para min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func getScriptsDir() string {
	exePath, _ := os.Executable()
	exeDir := filepath.Dir(exePath)
	exeDir, _ = filepath.EvalSymlinks(exeDir)
	return filepath.Join(exeDir, "scripts")
}

// IsHealthy verifica si LanceDB está disponible
func (c *Client) IsHealthy() bool {
	cmd := exec.Command("python", "-c", "import lancedb; print('ok')")
	_ = getScriptsDir() // solo para que el compilador no se queje
	err := cmd.Run()
	return err == nil
}
