import urllib.request
import re
from bs4 import BeautifulSoup
from agents.types import ResearchState

def clean_html_content(raw_html: str) -> str:
    """Strips boilerplate tags (nav, header, footer, script, style, ads) and extracts clean text."""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        # Remove useless script, style, nav, header, footer tags
        for element in soup(["script", "style", "nav", "header", "footer", "iframe", "aside", "form"]):
            element.decompose()
        
        text = soup.get_text(separator=" ")
        # Clean up consecutive whitespaces
        clean_text = re.sub(r'\s+', ' ', text).strip()
        return clean_text
    except Exception:
        # Regex fallback if BeautifulSoup encounters an error
        clean = re.sub(r'<script.*?>.*?</script>', '', raw_html, flags=re.DOTALL)
        clean = re.sub(r'<style.*?>.*?</style>', '', clean, flags=re.DOTALL)
        clean = re.sub(r'<[^>]+>', ' ', clean)
        return re.sub(r'\s+', ' ', clean).strip()

def run_crawler(state: ResearchState) -> dict:
    """Agent 3: Crawler Agent
    Scrapes web page HTML and strips boilerplate elements (ads, navigation bars).
    """
    search_results = state.get("search_results", [])
    crawled_documents = []

    hdr = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

    for result in search_results[:4]:
        url = result.get("url", "")
        title = result.get("title", "Web Document")
        existing_content = result.get("content", "")

        crawled_text = existing_content

        if url and url.startswith("http"):
            try:
                req = urllib.request.Request(url, headers=hdr)
                with urllib.request.urlopen(req, timeout=4) as response:
                    raw_html = response.read().decode('utf-8', errors='ignore')
                    extracted = clean_html_content(raw_html)
                    if len(extracted) > len(existing_content):
                        crawled_text = extracted
            except Exception as e:
                print(f"[Crawler Agent] Direct scrape skipped for {url}: {e}")

        crawled_documents.append({
            "url": url,
            "title": title,
            "full_text": crawled_text
        })

    return {
        "raw_documents": crawled_documents,
        "status": "crawled"
    }
