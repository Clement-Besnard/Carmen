import ollama

# clem-assist embarque les regles de forme (prose, pas de listes, concis).
# Interroger qwen3:8b directement les contourne : le modele nu retombe sur son
# style par defaut, verbeux et bourre de markdown.
r = ollama.generate(model="clem-assist", prompt="Quel temps fait-il aujourd'hui a Paris ?", think=False)
print(r["response"])

# Pour tester une variante de prompt systeme sans rebuild le modele :
# r = ollama.generate(
#     model="qwen3:8b",
#     prompt="Qu'est-ce que le RN ?",
#     system="Reponds en prose, en 3 phrases maximum. Jamais de liste ni de titre.",
#     think=False,
# )