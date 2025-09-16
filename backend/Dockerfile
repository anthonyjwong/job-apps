FROM mcr.microsoft.com/playwright/python:v1.55.0-noble

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# necessary for healthcheck to work
RUN apt-get update && apt-get install -y curl

# copy source and ensure proper ownership
COPY . .
RUN chown -R pwuser:pwuser /app

# run as non-root user (Playwright-provided user)
USER pwuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]