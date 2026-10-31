.PHONY: install train test lint api

install:
	pip install -e ".[dev]"

train:
	python -m src.ml.train

test:
	pytest -q

lint:
	ruff check src tests

api:
	uvicorn src.api.main:app --reload --port 8000

