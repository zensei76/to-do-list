import { fileURLToPath } from 'url';
import { dirname, join } from 'path'; // Importing join and dirname from path
import { config } from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

// Load environment variables from .env file
config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));



// PostgreSQL connection

// const caCertPath = join(__dirname, 'ca.pem'); // Path to your CA certificate file

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // ca: fs.readFileSync(caCertPath).toString(), // Load CA certificate file
	rejectUnauthorized: false // Bypass SSL certificate validation
  },
});

db.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Connection error', err));




// Routes

app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM items ORDER BY id ASC');
    const items = result.rows;

    console.log(items);
    res.render('index.ejs', {
      listTitle: 'Today',
      listItems: items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching items from database');
  }
});

app.post('/add', async (req, res) => {
  const item = req.body.newItem;
  try {
    await db.query('INSERT INTO items (title) VALUES ($1)', [item]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding new item');
  }
});

app.post('/edit', async (req, res) => {
  const id = req.body.updatedItemId;
  const item = req.body.updatedItemTitle;

  try {
    await db.query('UPDATE items SET title = $1 WHERE id = $2', [item, id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating item');
  }
});

app.post('/delete', async (req, res) => {
  const id = req.body.deleteItemId;
  try {
    await db.query('DELETE FROM items WHERE id = $1', [id]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting item');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
