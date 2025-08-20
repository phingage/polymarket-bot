import os
import requests
from pymongo import MongoClient

def main(args):
      mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
      mongo_db = os.environ.get("MONGO_DB", "polymarket")
      mongo_collection = os.environ.get("MONGO_COLLECTION", "markets")

      client = MongoClient(mongo_uri)
      db = client[mongo_db]
      collection = db[mongo_collection]

      # Fetch mercati attivi da Polymarket
      url = "https://api.polymarket.com/v1/markets?state=active"
      try:
            response = requests.get(url)
            response.raise_for_status()
            markets = response.json().get("markets", [])
      except Exception as e:
            return {"body": f"Errore nel recupero mercati: {str(e)}"}

      # Salva i mercati su MongoDB
      if markets:
            collection.delete_many({})  # Pulisce la collezione prima di inserire
            collection.insert_many(markets)
            return {"body": f"Salvati {len(markets)} mercati attivi su MongoDB"}
      else:
            return {"body": "Nessun mercato attivo trovato"}
