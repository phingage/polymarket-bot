import os
import requests
from pymongo import MongoClient
from datetime import datetime, timezone

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
    mongo_uri = os.environ.get("MONGO_URI")
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

    # Salva i mercati su MongoDB usando upsert basato su id
    if markets:
        # Estrai tutti gli ID dai mercati dell'API
        api_market_ids = []
        for market in markets:
            market_id = market.get('id')
            if market_id:
                api_market_ids.append(market_id)
        
        print(f"Mercati dall'API: {len(api_market_ids)} ID validi")
        
        # Elimina i mercati che non sono più presenti nell'API (non attivi)
        if api_market_ids:
            delete_result = collection.delete_many({
                "id": {"$nin": api_market_ids}  # Elimina documenti con id non contenuto nella lista
            })
            deleted_count = delete_result.deleted_count
            print(f"Eliminati {deleted_count} mercati non più attivi")
        else:
            deleted_count = 0
        
        # Processa i mercati dall'API
        updated_count = 0
        inserted_count = 0
        
        for market in markets:
            market_id = market.get('id')
            if not market_id:
                print(f"Mercato senza id trovato, saltato: {market}")
                continue
            
            # Aggiungi timestamp di inserimento/aggiornamento
            market["lastUpdateAt"] = datetime.now(timezone.utc)
            
            # Usa upsert con $set per aggiornare solo i campi presenti, preservando quelli esistenti
            result = collection.update_one(
                {"id": market_id},  # Filter by id
                {"$set": market},  # Update only the fields present in market data
                upsert=True  # Create if doesn't exist
            )
            
            if result.upserted_id:
                inserted_count += 1
            else:
                updated_count += 1
        
        return {"body": f"Processati {len(markets)} mercati: {inserted_count} inseriti, {updated_count} aggiornati, {deleted_count} eliminati"}
    else:
        return {"body": "Nessun mercato attivo trovato"}
