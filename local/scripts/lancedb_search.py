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

DB_PATH = "./data/lancedb"
TABLE_NAME = "documents"

def search_documents(query, limit=5):
    """Busca documentos similares por vector"""
    try:
        # Cargar modelo (silencioso)
        model = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')
        
        # Generar embedding del query
        query_vector = model.encode(query).tolist()
        
        # Conectar a LanceDB
        db = lancedb.connect(DB_PATH)
        table = db.open_table(TABLE_NAME)
        
        # Buscar por similitud
        results = table.search(query_vector).limit(limit).to_pandas()
        
        # Formatear resultados
        output = []
        for _, row in results.iterrows():
            metadata = json.loads(row['metadata']) if row['metadata'] else {}
            output.append({
                "id": row['id'],
                "text": row['text'][:500],  # Primeros 500 chars
                "distance": float(row['_distance']),
                "metadata": metadata
            })
        
        return output
    
    except Exception as e:
        return [{"error": str(e)}]


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps([{"error": "Usage: lancedb_search.py <query> [limit]"}]))
        sys.exit(1)
    
    query = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    results = search_documents(query, limit)
    
    # Imprimir SOLO el JSON, nada más
    print(json.dumps(results, ensure_ascii=False))