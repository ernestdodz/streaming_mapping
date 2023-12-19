import Fastify from 'fastify'

import { parse } from 'node-html-parser';
import axios from 'axios';

const fastify = Fastify({
  logger: false
})

// Declare a route
fastify.get('/', async function handler (request, reply) {
  
    const info = await axios.get("https://www.fmovies.ink/movie/watch-chaos-full-16941")
               .then(res => ({ html: res.data, url: res.config.url }));
            
    const root = parse(info.html);
    const title_searched = root.querySelector('.heading-name').text
    const release_date = root.querySelector('.row-line').childNodes[2].text.trim()

    const type = info.url.match(/\/(tv|movie)\//)[1];

    const tmdb = await axios.get(
      `https://api.themoviedb.org/3/search/${type}`, {
          params: { 
          api_key: "8d12775adaf4e75ea96c81ec66ddd3fe",
          query: title_searched,
          primary_release_year: release_date,
          year: release_date
      } } ).then((res) => ({results: res.data.results, url: res.config.params}) ); 

      const best_match = (type === "movie") ? tmdb.results.find(item => item.release_date  === release_date)
                          ?? tmdb.results[0] : tmdb.results.find(item => item.first_air_date  === release_date) ?? tmdb.results[0];

      
      console.log(tmdb.url);

      return { title_searched, type, release_date, results: tmdb.results, best_match }
})

// Run the server!
try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}