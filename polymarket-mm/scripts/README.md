# Polymarket Allowance Setup Scripts

Scripts per configurare le allowance USDC necessarie per fare trading su Polymarket.

## 🎯 Cos'è l'Allowance?

Per tradare su Polymarket, devi autorizzare i loro smart contract a spendere i tuoi USDC. Questo processo si chiama "allowance" ed è uno standard di sicurezza degli smart contract ERC-20.

## 📋 Contratti Polymarket su Polygon

- **USDC Contract**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **CTF Exchange**: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` (principale per trading)
- **CTF Framework**: `0x4d97dcd97ec945f40cf65f87097ace5ea0476045`

## 🚀 Come Usare

### 1. Installazione

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Preparazione

- Assicurati di avere USDC nel tuo wallet MetaMask su Polygon
- Esporta la tua private key da MetaMask (Settings > Advanced > Export Private Key)

⚠️ **ATTENZIONE**: La private key dà accesso completo al wallet. Non condividerla mai!

### 3. Esecuzione

```bash
python set_allowance.py
```

Lo script ti chiederà:
1. **Private Key**: La chiave privata del tuo wallet MetaMask
2. **Amount**: Quanto USDC autorizzare (lascia vuoto per unlimited)
3. **Conferma**: Conferma l'operazione

### 4. Esempio di Output

```
🏛️  Polymarket USDC Allowance Setup
============================================================
✅ Connected to Polygon network (Chain ID: 137)
📄 USDC Contract: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
📄 CTF Exchange: 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E

🔐 Loaded wallet: 0x1234...5678
💵 USDC Balance: 1000.50
📋 Current CTF Exchange allowance: 0 USDC

🔄 Setting up CTF Exchange allowance...
💰 Approving unlimited USDC spending for 0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E
📤 Transaction sent: 0xabc123...def456
🔗 View on PolygonScan: https://polygonscan.com/tx/0xabc123...def456
⏳ Waiting for transaction confirmation...
✅ Transaction confirmed!
✅ New CTF Exchange allowance: 115792089237316195423570985008687907853269984665640564039457584007913129639935 USDC

============================================================
🎉 Polymarket allowances setup complete!
📝 You can now trade on Polymarket using your wallet
🔗 Visit: https://polymarket.com
```

## 🔒 Sicurezza

### Opzioni di Allowance

1. **Unlimited**: Approvi il contratto a spendere qualsiasi quantità
   - ✅ Non devi ripetere l'operazione
   - ❌ Rischio teorico se il contratto viene compromesso

2. **Specific Amount**: Approvi solo una quantità specifica
   - ✅ Più sicuro
   - ❌ Devi ripetere quando finisci l'allowance

### Best Practices

- Usa wallet separati per trading (non il tuo wallet principale)
- Monitora le transazioni su PolygonScan
- Revoca allowance se non usi più il servizio

## 🛠️ Troubleshooting

### Error: "Failed to connect to Polygon network"
- Verifica la connessione internet
- Prova un altro RPC endpoint

### Error: "insufficient funds for gas"
- Assicurati di avere MATIC per pagare le gas fees su Polygon

### Error: "Invalid private key"
- Verifica che la private key sia corretta e completa
- Rimuovi spazi o caratteri extra

### Error: "Transaction failed"
- Aumenta il gas limit nel codice
- Riprova più tardi se la rete è congestionata

## 📊 Costi

- **Gas Fee**: ~$0.01-$0.05 USD in MATIC per transazione
- **Allowance**: Operazione una tantum per contratto

## 🔗 Link Utili

- [Polymarket](https://polymarket.com)
- [PolygonScan](https://polygonscan.com)
- [Polygon Bridge](https://wallet.polygon.technology/polygon/bridge)
- [MetaMask Setup](https://docs.polygon.technology/develop/metamask/config-polygon-on-metamask/)

## ⚡ Script Avanzato

Per configurazioni automatiche, puoi impostare la private key come variabile d'ambiente:

```bash
export WALLET_PRIVATE_KEY="your_private_key_here"
python set_allowance.py
```

## 🆘 Supporto

Se hai problemi:
1. Controlla i logs per errori specifici
2. Verifica il saldo USDC e MATIC
3. Controlla lo stato della transazione su PolygonScan
4. Riprova con gas price più alto se necessario