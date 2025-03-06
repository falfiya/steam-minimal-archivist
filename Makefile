ifeq ($(OS), Windows_NT)
	PATH := ./node_modules/.bin;$(PATH)
else
	PATH := ./node_modules/.bin:$(PATH)
endif

run: build
	node js/main

opts += --format=esm
opts += --platform=node
opts += --packages=external
opts += --loader:.sql=text

build:
	esbuild src/main.ts $(opts) --outfile=js/main.js

typecheck:
	tsc --noEmit
