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

def delete_document(doc_id):
    """Elimina un documento por ID"""
    try:
        db = lancedb.connect(DB_PATH)
        table = db.open_table(TABLE_NAME)
        
        # LanceDB usa delete con expresión SQL
        table.delete(f"id = '{doc_id}'")
        
        return {"success": True, "id": doc_id}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: lancedb_delete.py <doc_id>"}))
        sys.exit(1)
    
    doc_id = sys.argv[1]
    result = delete_document(doc_id)
    print(json.dumps(result))