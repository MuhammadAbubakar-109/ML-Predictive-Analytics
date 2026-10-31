FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

COPY pyproject.toml ./
RUN pip install --no-cache-dir pandas numpy scikit-learn joblib pyyaml fastapi "uvicorn[standard]" pydantic-settings

COPY src ./src
COPY configs ./configs
# models/ is mounted as a volume (see docker-compose.yml); train first with `make train`

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
