require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

let urls = [];

app.post('/api/shorturl', (req, res) => {
  const original_url = req.body.url;

  if (!/^https?:\/\/.+/i.test(original_url)) {
    return res.json({ error: 'invalid url' });
  }
  
  const short_url = urls.length + 1;
  urls.push({
    original_url: original_url,
    short_url: short_url
  });
  
  res.json({
    original_url: original_url,
    short_url: short_url
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const entry = urls.find(u => u.short_url == req.params.id);
  if (entry) {
    res.redirect(entry.original_url);
  } else {
    res.json({error: 'No short URL found'});
  }
});  


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});