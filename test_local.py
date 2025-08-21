#!/usr/bin/env python3
"""
Script per testare la funzione main in locale
"""
import os
import sys

# Aggiungi il path del modulo
markets_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'polymarket-markets', 'packages', 'polymarket', 'markets')
sys.path.insert(0, markets_path)

# Esegui il file __main__.py per caricare le funzioni
main_file = os.path.join(markets_path, "__main__.py")
with open(main_file, 'r', encoding='utf-8') as f:
    code = f.read()

# Crea un namespace locale ed esegui il codice
namespace = {}
exec(code, namespace)

# Estrai la funzione main dal namespace
main = namespace['main']


def test_local():
    # Configura le variabili di ambiente per il test
    os.environ["MONGO_URI"] = "mongodb://localhost:27017/"
    os.environ["MONGO_DB"] = "polymarket"
    os.environ["MONGO_COLLECTION"] = "markets"
    
    # Simula i parametri della funzione
    args = {}
    
    # Chiama la funzione main
    result = main(args)
    
    print("Risultato del test:")
    print(result)

if __name__ == "__main__":
    print("Testando la funzione main...")
    test_local()
