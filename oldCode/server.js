const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', express.static('html/index.html'));
const PORT = process.env.PORT || 3100;

/**
 * Serve static files from the "html" directory with cache control
 */
app.use(express.static(path.join(__dirname, 'html'), {
  etag: false,  // Disable ETag headers
  lastModified: false,  // Disable Last-Modified headers
  maxAge: 0,  // Set cache expiration to 0
}));
console.log('running rev 1.2');

/**
 * Wildcard route to  index.html for SPA or serve any xxx.html file as /xxx
 */
app.get('/:page', (req, res) => {
    const page = req.params.page; // Get the route parameter (e.g., 'survey')
    let filePath = path.join(__dirname, 'html', `${page}.html`);
    // Serve the .html file if it exists or index if not
    res.sendFile(filePath, (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'html', 'index.html'));
        }
    });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

