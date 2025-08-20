import os
import requests
from pymongo import MongoClient

def fetch_all_markets():
    """Recupera tutti i mercati attivi con paginazione"""
    all_markets = []
    offset = 0
    limit = 100  # Numero massimo di risultati per chiamata
    
    print(f"Inizio fetch mercati attivi da Polymarket...")
    
    while True:
        page_num = offset // limit + 1
        url = f"https://gamma-api.polymarket.com/markets?active=true&archived=false&closed=false&limit={limit}&offset={offset}"
        
        print(f"Fetching pagina {page_num} (offset {offset})...")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            markets = response.json()  # La risposta è direttamente un array
            
            if not markets:
                print(f"Nessun mercato trovato alla pagina {page_num}. Fine paginazione.")
                break  # Nessun mercato trovato, fine paginazione
            
            all_markets.extend(markets)
            print(f"Recuperati {len(markets)} mercati dalla pagina {page_num}. Totale: {len(all_markets)}")
            
            # Se il numero di mercati è minore del limite, siamo all'ultima pagina
            if len(markets) < limit:
                print(f"Ultima pagina raggiunta (meno di {limit} mercati).")
                break
                
            offset += limit
            
        except Exception as e:
            raise Exception(f"Errore nel recupero mercati alla pagina {page_num}: {str(e)}")
    
    print(f"Fetch completato! Totale mercati recuperati: {len(all_markets)}")
    return all_markets

def main(args):
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    mongo_db = os.environ.get("MONGO_DB", "polymarket")
    mongo_collection = os.environ.get("MONGO_COLLECTION", "markets")

    client = MongoClient(mongo_uri)
    db = client[mongo_db]
    collection = db[mongo_collection]

    # Fetch tutti i mercati attivi da Polymarket con paginazione
    try:
        markets = fetch_all_markets()
    except Exception as e:
        return {"body": f"Errore nel recupero mercati: {str(e)}"}

    # Salva i mercati su MongoDB
    if markets:
        collection.delete_many({})  # Pulisce la collezione prima di inserire
        collection.insert_many(markets)
        return {"body": f"Salvati {len(markets)} mercati attivi su MongoDB"}
    else:
        return {"body": "Nessun mercato attivo trovato"}
