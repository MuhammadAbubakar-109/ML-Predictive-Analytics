.PHONY: install train test lint api ui up

install:
	$(MAKE) -C backend install
	cd frontend && npm install

train:
	$(MAKE) -C backend train

test:
	$(MAKE) -C backend test

lint:
	$(MAKE) -C backend lint

api:
	$(MAKE) -C backend api

ui:
	cd frontend && npm run dev

up:
	docker compose up --build
