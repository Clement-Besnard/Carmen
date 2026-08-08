import ollama
'''
# Chat (recommandé)
r = ollama.chat(model="qwen3:8b", messages=[
    {"role": "user", "content": "Qu'est-ce que le RN ?"}
])
print(r["message"]["content"])
'''
# Génération simple (prompt brut)
r = ollama.generate(model="qwen3:8b", prompt="Qu'est-ce que le RN ?")
print(r["response"])