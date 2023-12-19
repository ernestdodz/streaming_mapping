import Fastify from "fastify";

import { parse } from "node-html-parser";
import axios from "axios";

const fastify = Fastify({
  logger: false,
});

function findClosestDateIndex(targetDate, dateArray) {
  targetDate = new Date(targetDate);

  if (dateArray.length === 0) {
    return -1;
  }

  const sortedIndexes = Array.from(
    { length: dateArray.length },
    (_, index) => index,
  ).sort((a, b) => {
    const dateA = new Date(dateArray[a]);
    const dateB = new Date(dateArray[b]);
    return Math.abs(targetDate - dateA) - Math.abs(targetDate - dateB);
  });

  return sortedIndexes[0];
}

// Declare a route
fastify.get("/", async function handler(request, reply) {
  const url = "https://www.fmovies.ink/tv/watch-one-piece-full-39514"
  const info = await axios
    .get(url)
    .then((res) => ({ html: res.data, url: res.config.url }));

  const root = parse(info.html);
  const title_searched = root.querySelector(".heading-name").text;
  const release_date = root
    .querySelector(".row-line")
    .childNodes[2].text.trim();

  const type = info.url.match(/\/(tv|movie)\//)[1];

  const tmdb = await axios
    .get(`https://api.themoviedb.org/3/search/${type}`, {
      params: {
        api_key: "8d12775adaf4e75ea96c81ec66ddd3fe",
        query: title_searched,
        primary_release_year: release_date,
        year: release_date,
      },
    })
    .then((res) => ({ results: res.data.results, url: res.config.params }));

  const best_match_index = findClosestDateIndex(
    release_date,
    tmdb.results.map((ele) => ele.release_date ?? ele.first_air_date),
  );
  const best_match = tmdb.results[best_match_index];

  console.debug("61 : ", best_match);

  console.log(tmdb.url);

  return {
    title_searched,
    type,
    release_date,
    results: tmdb.results,
    best_match,
  };
});

// Run the server!
try {
  const port = 3000;
  await fastify.listen({ port }).then(() => {
    console.log(`Server started on port ${port}`);
  });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
