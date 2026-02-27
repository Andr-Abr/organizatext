// local/backend/pkg/lancedb/operations.go
// Operaciones adicionales para LanceDB

package lancedb

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
)

// ListDocuments retorna lista de todos los documentos
func (c *Client) ListDocuments() ([]Document, error) {
	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_list.py"))
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("error listing documents: %w", err)
	}

	var docs []Document
	if err := json.Unmarshal(output, &docs); err != nil {
		return nil, fmt.Errorf("error parsing list: %w", err)
	}

	return docs, nil
}

// DeleteDocument elimina un documento por ID
func (c *Client) DeleteDocument(docID string) error {
	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_delete.py"), docID)
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("error deleting document: %s - %w", string(output), err)
	}

	var result struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		return fmt.Errorf("error parsing delete result: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("delete failed: %s", result.Error)
	}

	return nil
}

// GetStats retorna estadísticas de la base de datos
func (c *Client) GetStats() (map[string]interface{}, error) {
	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_stats.py"))
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("error getting stats: %w", err)
	}

	var stats map[string]interface{}
	if err := json.Unmarshal(output, &stats); err != nil {
		return nil, fmt.Errorf("error parsing stats: %w", err)
	}

	return stats, nil
}

// UpdateMetadata actualiza la metadata de un documento
func (c *Client) UpdateMetadata(docID string, metadata map[string]interface{}) error {
	// Convertir metadata a JSON
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("error marshaling metadata: %w", err)
	}

	scriptsDir := getScriptsDir()
	cmd := exec.Command("python", filepath.Join(scriptsDir, "lancedb_update_metadata.py"), docID, string(metadataJSON))
	cmd.Stderr = nil

	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("error updating metadata: %s - %w", string(output), err)
	}

	var result struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		return fmt.Errorf("error parsing update result: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("update failed: %s", result.Error)
	}

	return nil
}
