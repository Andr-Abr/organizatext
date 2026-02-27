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

warnings.filterwarnings('ignore')
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'

import lancedb

DB_PATH = "./data/lancedb"
TABLE_NAME = "documents"

def update_metadata(doc_id, metadata_dict):
    """Actualiza la metadata de un documento"""
    try:
        db = lancedb.connect(DB_PATH)
        table = db.open_table(TABLE_NAME)
        
        # Obtener documento actual
        df = table.to_pandas()
        doc_row = df[df['id'] == doc_id]
        
        if len(doc_row) == 0:
            return {"success": False, "error": f"Document {doc_id} not found"}
        
        # Actualizar metadata
        metadata_json = json.dumps(metadata_dict)
        
        # LanceDB no tiene UPDATE directo, hay que:
        # 1. Eliminar el documento viejo
        # 2. Insertar con nueva metadata
        
        # Guardar datos del documento
        old_text = doc_row.iloc[0]['text']
        old_vector = doc_row.iloc[0]['vector']
        
        # Eliminar viejo
        table.delete(f"id = '{doc_id}'")
        
        # Insertar con nueva metadata
        table.add([{
            "id": doc_id,
            "text": old_text,
            "vector": old_vector,
            "metadata": metadata_json
        }])
        
        return {"success": True, "id": doc_id}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: lancedb_update_metadata.py <doc_id> <metadata_json>"}))
        sys.exit(1)
    
    doc_id = sys.argv[1]
    metadata_json = sys.argv[2]
    
    try:
        metadata_dict = json.loads(metadata_json)
    except:
        print(json.dumps({"success": False, "error": "Invalid JSON metadata"}))
        sys.exit(1)
    
    result = update_metadata(doc_id, metadata_dict)
    print(json.dumps(result))