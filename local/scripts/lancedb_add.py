#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import os
import warnings

# Silenciar warnings
warnings.filterwarnings('ignore')
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

import lancedb
from sentence_transformers import SentenceTransformer
from pathlib import Path

# Configuración
DB_PATH = "./data/lancedb"
TABLE_NAME = "documents"

def add_document(doc_id, text, metadata=None):
    """Agrega un documento a LanceDB"""
    try:
        # Cargar modelo de embeddings (silencioso)
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        
        # Generar embedding
        vector = model.encode(text).tolist()
        
        # Conectar a LanceDB
        db = lancedb.connect(DB_PATH)
        
        # Abrir o crear tabla
        try:
            table = db.open_table(TABLE_NAME)
        except:
            import pyarrow as pa
            schema = pa.schema([
                pa.field("id", pa.string()),
                pa.field("text", pa.string()),
                pa.field("vector", pa.list_(pa.float32(), 384)),
                pa.field("metadata", pa.string())
            ])
            table = db.create_table(TABLE_NAME, schema=schema)
        
        # Preparar metadata
        if metadata is None:
            metadata = {}
        metadata_json = json.dumps(metadata)
        
        # Agregar documento
        data = [{
            "id": doc_id,
            "text": text,
            "vector": vector,
            "metadata": metadata_json
        }]
        
        table.add(data)
        
        return {"success": True, "id": doc_id}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: lancedb_add.py <doc_id> <text|--file path> [metadata_json]"}))
        sys.exit(1)
    
    doc_id = sys.argv[1]
    
    if sys.argv[2] == "--file":
        with open(sys.argv[3], 'r', encoding='utf-8') as f:
            text = f.read()
        metadata = json.loads(sys.argv[4]) if len(sys.argv) > 4 else {}
    else:
        text = sys.argv[2]
        metadata = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    
    result = add_document(doc_id, text, metadata)
    
    # Imprimir SOLO el JSON
    print(json.dumps(result))