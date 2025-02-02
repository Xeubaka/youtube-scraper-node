# Youtube Scrapper Node

This project was developed as a study exercise.

Its current functions are:
- Search with a guiven query the 200 first videos on the Youtube(via its api);
- Get the top 5 words used on title and descriptions from the searched videos;
- Organize a watchlist schedule of thoose videos;
    - Guiven a number of minutes for each day of the week, it will organized the amout of videos for you to watch at the guiven day;

## What technologies are used for this project?

This project is built with .

- Docker
- Vite
- TypeScript
- React
- Tailwind CSS

## Running with Docker

The only requirement is having Docker installed - [install docker](https://docs.docker.com/get-started/get-docker/)

Follow these steps:

```sh
# Step 1: Run the application.
docker-compose up -d
```


## Running without Docker

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Install the necessary dependencies.
npm i

# Step 2: Start the development server with auto-reloading and an instant preview.
npm run dev
```