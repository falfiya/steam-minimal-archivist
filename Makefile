ifeq ($(OS), Windows_NT)
	PATH := ./node_modules/.bin;$(PATH)
else
	PATH := ./node_modules/.bin:$(PATH)
endif

run: build .config.json
	node js/main

config.json:
	node util/config

opts := --bundle
opts += --format=esm
opts += --platform=node
opts += --packages=external
opts += --loader:.sql=text
opts += --outfile=js/main.js

build:
	esbuild src/main.ts $(opts)
