# Guida DNS Aruba per creareapp.it → Netlify

## 📋 Checklist configurazione:

### 1. Login Aruba
- [ ] Accesso a admin.aruba.it
- [ ] Vai su "I miei servizi" → "Domini"
- [ ] Seleziona "creareapp.it"
- [ ] Clicca "Gestione DNS"

### 2. Elimina record esistenti
- [ ] Rimuovi eventuali record A per @
- [ ] Rimuovi eventuali record CNAME per www
- [ ] Rimuovi record AAAA se presenti

### 3. Aggiungi nuovi record
**Record A:**
- [ ] Tipo: A
- [ ] Nome: @ (o vuoto)
- [ ] Valore: 75.2.60.5
- [ ] TTL: 14400

**Record CNAME:**
- [ ] Tipo: CNAME
- [ ] Nome: www
- [ ] Valore: [TUO-SITO].netlify.app
- [ ] TTL: 14400

### 4. Verifica
- [ ] Salva modifiche su Aruba
- [ ] Attendi 15-60 minuti
- [ ] Controlla su Netlify: Domain settings
- [ ] Test: apri creareapp.it

## 🔍 Comandi verifica:
```bash
nslookup creareapp.it
nslookup www.creareapp.it
dig creareapp.it
```

## ⏰ Timeline:
- Propagazione Aruba: 15-60 minuti
- SSL Netlify: automatico dopo DNS
- Sito attivo: entro 1-2 ore

## 🆘 Problemi comuni:
1. **Record A non funziona:** prova CNAME per @
2. **Errore TTL:** usa 3600 invece di 14400
3. **@ non accettato:** lascia campo nome vuoto
4. **CNAME root:** alcuni provider non supportano, usa solo A record