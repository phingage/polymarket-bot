#!/usr/bin/env python3
"""
Script per testare la funzione main in locale
"""
import os
import sys

# Aggiungi il path del modulo
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from __main__ import main

def test_local():
    # Configura le variabili di ambiente per il test
    os.environ["MONGO_URI"] = "mongodb://localhost:27017/"
    os.environ["MONGO_DB"] = "polymarket_test"
    os.environ["MONGO_COLLECTION"] = "markets_test"
    
    # Simula i parametri della funzione
    args = {}
    
    # Chiama la funzione main
    result = main(args)
    
    print("Risultato del test:")
    print(result)

if __name__ == "__main__":
    print("Testando la funzione main...")
    test_local()
