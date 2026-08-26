FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir "fastapi==0.115.6" "uvicorn[standard]==0.34.0" "httpx==0.28.1"

COPY bridge.py /app/bridge.py

EXPOSE 7861

CMD ["uvicorn", "bridge:app", "--host", "0.0.0.0", "--port", "7861"]
