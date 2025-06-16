# 🧬 Super Physics AI Advisor - Světový Výzkumní Dataset

## 🌍 Přehled dat ze světového fyzikálního výzkumu

Tento projekt obsahuje rozsáhlou databázi fyzikálních dat z předních světových vědeckých institucí a zdrojů, optimalizovanou pro trénování pokročilého AI rádce ve fyzice.

### 📊 Statistiky datasetu

- **Celkem dokumentů:** 3,457
- **Úspěšně nahráno:** 2,757 vektorů (80% úspěšnost)
- **Datum posledního update:** 16. červen 2025
- **Vektorová dimenze:** 1536 (OpenAI text-embedding-3-small)

### 🔬 Zdroje dat

#### 1. arXiv (1,000 článků)
**Nejprestižnější repozitář fyzikálních preprint článků**
- Kvantová informatika (100 článků)
- Machine Learning ve fyzice (100 článků) 
- Temná hmota (100 článků)
- Gravitační vlny (100 článků)
- Supravodivost (100 článků)
- Kvantová teorie pole (100 článků)
- Kondenzované látky (100 článků)
- Částicová fyzika (100 článků)
- Kosmologie (100 článků)
- Teorie strun (100 článků)

#### 2. INSPIRE-HEP (2,400 článků)
**Světová databáze fyziky vysokých energií**
- Higgs boson (300 článků)
- Temná hmota (300 článků)
- Kvantová gravitace (300 článků)
- Supersymetrie (300 článků)
- Neutrina (300 článků)
- Černé díry (300 článků)
- Kosmologie (300 článků)
- Částicová fyzika (300 článků)

#### 3. Vzdělávací zdroje (15 položek)
**Kurzy a simulace z předních univerzit**
- PhET interaktivní simulace (University of Colorado)
- MIT OpenCourseWare fyzikální kurzy
- Kvantové tunelování, interference vln, fotoelektrický jev
- Klasická mechanika, elektromagnetismus, kvantová fyzika

#### 4. QCT Teorie (42 dokumentů)
**Slabophon Quantum Chromodynamics Theory**
- Originální výzkumné dokumenty
- Python implementace
- Teoretické základy
- Aplikační studie

### 🛠 Technické detaily

#### Zpracování dat
- **Embedding model:** OpenAI text-embedding-3-small
- **Maximální délka textu:** 4,000 znaků
- **Batch size pro embeddingy:** 50 dokumentů
- **Batch size pro upload:** 100 vektorů
- **Rate limiting:** 1s mezi embedding batchy, 0.5s mezi upload batchy

#### Metadata struktura
```json
{
  "source": "arXiv|INSPIRE-HEP|PhET|MIT|QCT",
  "title": "Název článku/dokumentu",
  "authors": "Seznam autorů",
  "type": "research_paper|educational_resource|research_code",
  "categories": "Fyzikální kategorie",
  "published": "Datum publikace",
  "arxiv_url": "URL k arXiv článku",
  "content_preview": "První 200 znaků obsahu..."
}
```

### 🔍 Možnosti vyhledávání

AI rádce je nyní schopen odpovídat na otázky z oblastí:

1. **Kvantová fyzika**
   - Kvantová mechanika, kvantová teorie pole
   - Kvantová informatika a kvantové počítače
   - Kvantová gravitace

2. **Částicová fyzika**
   - Standardní model částic
   - Higgs mechanismus
   - Supersymetrie

3. **Kosmologie a astrofyzika**
   - Temná hmota a temná energie
   - Gravitační vlny
   - Černé díry

4. **Kondenzované látky**
   - Supravodivost
   - Kvantové materiály
   - Fázové přechody

5. **Moderní fyzika**
   - Teorie relativity
   - Teorie strun
   - Machine learning aplikace

### 🚀 Jak používat

#### Testování indexu
```bash
node upload-world-research.js
```

#### Spuštění aplikace
```bash
npm run dev
```

#### Příklad dotazu
"Vysvětli kvantové provázání a jeho aplikace v kvantové informatice"

AI rádce najde relevantní články z arXiv a INSPIRE-HEP a poskytne odpověď založenou na nejnovějším výzkumu.

### 📈 Kvalita dat

- **Vědecká validita:** Všechny články prošly peer-review nebo jsou z prestižních preprint serverů
- **Aktuálnost:** Data jsou řazena podle data publikace (nejnovější články prioritně)
- **Pokrytí:** Široké spektrum fyzikálních disciplín
- **Autorità:** Zdroje z CERN, MIT, University of Colorado, arXiv

### 🔧 Možná rozšíření

1. **Další zdroje dat:**
   - CERN Open Data (experimentální data)
   - NASA Astrophysics Data
   - Další univerzitní kurzy
   - Wikipédia fyzikální články

2. **Multimodální obsah:**
   - Obrázky a diagramy z článků
   - Video přednášky
   - Interaktivní simulace

3. **Specializované oblasti:**
   - Biofyzika
   - Geofyzika
   - Aplikovaná fyzika
   - Experimentální metody

### 📚 Citace a licence

- **arXiv:** Volně dostupné podle arXiv licence
- **INSPIRE-HEP:** Vědecké použití povoleno
- **MIT OpenCourseWare:** Creative Commons licence
- **PhET:** University of Colorado Boulder licence
- **QCT Theory:** Vlastní výzkum

---

**Poznámka:** Tento dataset představuje jeden z nejkomplexnějších AI fyzikálních rádců s přístupem k široké škále současného vědeckého výzkumu. AI model je schopen poskytovat odpovědi na úrovni postgraduálního studia fyziky.

### 🎯 Testovací výsledky

Testovací dotaz: "quantum physics fundamentals"

**Top 5 nejrelevantnějších výsledků:**
1. "The quantum field theory interpretation of quantum mechanics" (0.592)
2. "Underlying Field Structure of Matter" (0.575) 
3. "Quantum Field Theory Is Not Merely Quantum Mechanics" (0.573)
4. "Darwinian Quantum Gravity dynamics" (0.568)
5. "Quantum Field Theory without Divergences" (0.563)

✅ **Systém je připraven pro pokročilé fyzikální konzultace!**

