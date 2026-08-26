# meme68
Website repo for the [meme68](https://meme68.com) website

## What is this?
Simple fun website to host a collection of goofy images for college students to enjoy.

## :computer: Development Installation
### :hammer: Install Dependencies
This project was built using SvelteKit, MySQL, bun, and Docker. It is recommended before developing that you have installed:
- nodejs
- npm
- bun
- docker (and the compose plugin)

### :wrench: Build
```console
bun install
bun run dev -- --open
```

## :chart_with_upwards_trend: Production
This project uses Docker :whale: for production set-up

**docker-compose became deprecated within latest versions of Ubuntu and some python packages have became deprecated**

The following commands will build the docker via compose which builds the multi-docker system.
You will need to move the `.env` into the project root folder before running the following:

### How to use docker compose on latest Ubuntu installs:
- Follow install instructions from [Install Documentation](https://docs.docker.com/engine/install/ubuntu/)

Prepare and run Docker container locally
```console
# remove volumes
docker compose down -v

# build/rebuild compose
docker compose up -d --build
```