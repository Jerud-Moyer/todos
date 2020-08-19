const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/todos', async(req, res) => {
  const data = await client.query('SELECT * FROM todos');

  res.json(data.rows);
});

app.get('/api/todos/:id', async(req, res) => {
  const todoId = req.params.id;

  const data = await client.query(`
    SELECT * FROM todos
    WHERE todo.id=$1 AND todo.owner_id=$2
    `, [todoId, req.userId]);

  res.json(data.rows);
});

app.use(require('./middleware/error'));

app.post('/api/todos', async(req, res) => {
  const newtodo = {
    todo: req.body.todo,
    completed: req.body.completed
  };
  const data = await client.query(`
  INSERT INTO todos(todo, completed, owner_id)
  VALUES($1, $2, $3)
  RETURNING *
  `, [newtodo.todo, newtodo.completed, req.userId]);

  res.json(data.rows[0]);
});


app.put('/api/todos/:id', async(req, res) => {
  const todoId = req.params.id;

  try {
    const updatedTodo = {
      todo: req.body.todo,
      completed: req.body.completed
    };

    const data = await client.query(`
    UPDATE todos
      SET todo=$1, completed=$2
      WHERE todos.id = $3 AND todos.owner_id = $4
      RETURNING *
      `, [updatedTodo.todo, updatedTodo.completed, todoId, req.userId]);
      
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});




module.exports = app;
