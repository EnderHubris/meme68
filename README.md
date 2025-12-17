# meme68
Website repo for the meme68 website

## What is this?
Simple fun website to host a collection of goofy images for college students to enjoy.

## :computer: Development Installation
### :hammer: Install Dependencies
You will need to install the latest `npm` and `nodejs` binaries, along with docker and the compose plugin.

### :wrench: Build
```bash
# installs dependencies/packages tracked by this project
npm install .
# compile and run the frontend locally
npm run dev
```

Move the web related `.env` file into the project root directory, then run the following to run the backend locally.
```bash
nodejs backend/server.js
```

## :chart_with_upwards_trend: Production
This project uses Docker :whale: for production set-up

**docker-compose became deprecated within latest versions of Ubuntu and some python packages have became deprecated**

The following commands will build the docker via compose which builds the multi-docker system.
You will need to move the `.env` into the project root folder before running the following:

### How to use docker compose on latest Ubuntu installs:
- Follow install instructions from [Install Documentation](https://docs.docker.com/engine/install/ubuntu/)

Prepare and run Docker container
```bash
# create docker project called meme68
sudo docker compose --env-file .env -p meme68 up --build -d
```