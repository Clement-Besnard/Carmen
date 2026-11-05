import re

import httpx
import ollama

question = "Quelle est la température à Paris actuellement ?"

# SearXNG ne renvoie que des meta-descriptions, souvent vides d'info : on lit les pages.
def texte(url, repli):
    try:
        html = httpx.get(url, timeout=15, follow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0"}).text
        html = re.sub(r"(?s)<(script|style).*?</\1>", " ", html)
        return " ".join(re.sub(r"<[^>]+>", " ", html).split())[:3000]
    except httpx.HTTPError:
        return repli

resultats = httpx.get("http://127.0.0.1:8081/search",
                      params={"q": question, "format": "json"}, timeout=20).json()["results"][:3]
contexte = "\n\n".join(f"[{i}] {r['url']}\n{texte(r['url'], r['content'])}"
                       for i, r in enumerate(resultats, 1))

# system= ecrase le prompt vocal de clem-assist, qui interdit les reponses developpees.
r = ollama.generate(
    model="franck_model",
    prompt=f"{contexte}\n\nQuestion : {question}",
    system="Reponds en prose a partir des extraits. Si tu ne sais pas, dis-le. Fait des paragraphes, ne fais pas de liste. Ne cite pas les sources.",
    think=False,
)
print(r["response"])
