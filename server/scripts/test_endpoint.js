const axios = require('axios');
axios.post('http://localhost:5001/api/scrape', { url: "https://pesdb.net/pes2022/?featured=282" })
    .then(res => console.log(res.data))
    .catch(err => console.error(err.response ? err.response.data : err.message));
