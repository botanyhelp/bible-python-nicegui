# ScriptureVault - Bible & Canonical Scripture Search & Reader

High-performance scripture search and study engine with in-memory indexing across canonical texts, book/chapter/verse browsing, and a single-container deployment bundle for **Google Cloud Run** using Python and NiceGUI.

---

## ⚡ Architecture & In-Memory Data Structure

ScriptureVault loads all **41,995 canonical verses** (Holy Bible Old & New Testament, Book of Mormon, Doctrine and Covenants, Pearl of Great Price) into memory on initialization:

1. **Hierarchical Navigation Tree**:
   - `Volume` $\to$ `Book` $\to$ `Chapter` $\to$ `Verse`
   - Enables instantaneous $O(1)$ lookup of any passage.
2. **Inverted Word Index**:
   - Maps normalized word tokens to array of verse indices.
   - Computes multi-word boolean searches (`AND`, `OR`, `Exact Phrase`) in sub-millisecond time ($< 1\text{ ms}$).
3. **Citation & Reference Resolver**:
   - Parses human query citations (e.g., `John 3:16`, `Genesis 1:1`, `Romans 8:28`, `Psalms 23`) and resolves to exact verse records.

---

## 🚀 Running the Python + NiceGUI App

### Prerequisites
- Python 3.10+
- `pip install -r requirements.txt`

### Local Execution
```bash
python app.py
```
NiceGUI will launch and listen on `http://localhost:8080` (or the port defined by the `PORT` environment variable).

---

## 🐳 Google Cloud Run Single-Container Deployment

ScriptureVault is configured to run as a stateless, auto-scaling single container on Google Cloud Run:

### 1. Build and Deploy in 1 Command
```bash
gcloud run deploy scripture-vault \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080
```

### 2. Or Build with Docker Locally
```bash
docker build -t scripture-vault .
docker run -p 8080:8080 -e PORT=8080 scripture-vault
```

### Cloud Run Optimizations:
- **Fast Cold Start**: Pre-packaged local JSON cache eliminates remote HTTP network latency during startup.
- **Scale-to-Zero**: Zero idle cost on Google Cloud Run with `min-instances 0`.
- **Low Memory Footprint**: Entire 41,995-verse in-memory inverted index requires only $\sim 120\text{ MB}$ of RAM.
