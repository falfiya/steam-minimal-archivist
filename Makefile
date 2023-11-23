PATH := ./node_modules/.bin;$(PATH)

run: build
	node js/main

build:
	esbuild src/main.ts --bundle --platform=node --format=esm --outfile=js/main.js
