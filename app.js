import express from 'express';
import { marked } from 'marked'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Recreate __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3011;


// --- CUSTOM LOGGING MIDDLEWARE ---
/**
 * Logs the incoming request URL for debugging static file lookups.
 */
function logger(req, res, next) {
    // Only log requests that look like static file requests (e.g., /css/style.css)
    //if (req.url.match(/\.(css|js|jpg|png|gif|svg)$/i)) {
        console.log(`Requested Asset URL: ${req.url}`);
    //}
    next();
}

app.use(logger); // <-- INSERTED LOGGER HERE

// --- STATIC FILES CONFIGURATION ---
// Mount the 'public' directory to serve static assets.
// Files inside 'public' can be accessed directly via the root path (/).
const staticPath = path.join(__dirname, 'public');
console.log('Static directory path:', staticPath); 
app.use(express.static(staticPath));
// --- END STATIC FILES CONFIGURATION ---

// --- CONFIGURATION ---
const MARKDOWN_DIR = path.join(__dirname, 'markdown_pages');
const PROJECT_FILES = [
    { name: 'Wilhelmina kinderziekenhuis', link: 'wilhelminakinderziekenhuis' },
    { name: 'Fietselfstedentocht', link: 'fietselfstedentocht' },
    { name: 'Koninginnedag', link: 'koninginnedag' },
    { name: 'Videobanden', link: 'videobanden' }
];

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- HELPER FUNCTION ---
/**
 * Reads a markdown file, converts it to HTML, and handles errors.
 */
function renderMarkdownPage(fileName, title, res) {
    const filePath = path.join(MARKDOWN_DIR, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`File not found: ${fileName}`, err);
            // Render a simple 404 page
            return res.status(404).render('layout', {
                title: 'Not Found',
                content: '<h1>404 Page Not Found</h1><p>The requested file does not exist.</p>',
                projectFiles: PROJECT_FILES 
            });
        }

        // Convert the Markdown content to HTML
        const contentHtml = marked(data.toString());

        // Render the EJS template
        res.render('layout', {
            title: title,
            content: contentHtml,
            projectFiles: PROJECT_FILES 
        });
    });
}

// --- ROUTES ---

// 1. Home Route (serves index.md)
app.get('/', (req, res) => {
    renderMarkdownPage('index.md', 'Home', res);
});

// 2. Project Route (serves file1.md to file4.md)
app.get('/project/:fileName', (req, res) => {
    const fileNameBase = req.params.fileName.toLowerCase();
    
    const isProjectFile = PROJECT_FILES.some(f => f.link === fileNameBase);
    
    if (isProjectFile) {
        const title = PROJECT_FILES.find(f => f.link === fileNameBase).name;
        renderMarkdownPage(`${fileNameBase}.md`, `Project: ${title}`, res);
    } else {
        renderMarkdownPage('non-existent.md', 'Not Found', res);
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});