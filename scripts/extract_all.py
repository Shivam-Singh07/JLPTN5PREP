"""
Full JLPT N5 Data Extraction Script
Extracts data from Basic 1 and Basic 2 PDFs and structures it into JSON for the web application.
"""
import fitz
import re
import json
import os

os.makedirs('data/vocab', exist_ok=True)
os.makedirs('data/grammar', exist_ok=True)
os.makedirs('data/listening', exist_ok=True)
os.makedirs('data/conversations', exist_ok=True)
os.makedirs('data/kanji', exist_ok=True)
os.makedirs('data/kana', exist_ok=True)
os.makedirs('data/drills', exist_ok=True)

print("Starting JLPT N5 Extraction...")

