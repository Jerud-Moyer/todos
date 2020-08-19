require('dotenv').config();
const { execSync } = require('child_process');
const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');
describe('routes', () => {
  let token;
  const newTodo = {
    id: 4,
    todo: 'eat',
    completed: false,
    owner_id: 2,
  };
  beforeAll(async done => {
    execSync('npm run setup-db');
    client.connect();
    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'jon@user.com',
        password: '1234'
      });
    token = signInData.body.token;
    return done();
  });
  afterAll(done => {
    return client.end(done);
  });
  test('returns a new todo when creating new todo', async(done) => {
    const data = await fakeRequest(app)
      .post('/api/todos')
      .send(newTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(newTodo);
    done();
  });
  test.only('returns all todos for the user when hitting GET /todos', async(done) => {
    const expected = [
      {
        id: 4,
        todo: 'eat',
        completed: false,
        owner_id: 2,
      },
      {
        completed: false,
        id: 1,
        owner_id: 1,
        todo: 'finish lab',
      },
      {
        completed: false,
        id: 2,
        owner_id: 1,
        todo: 'drink a beer',
      },
      {
        completed: false,
        id: 3,
        owner_id: 1,
        todo: 'got to sleep',
      },
    ];
    const data = await fakeRequest(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });
  test('returns a single todo for the user when hitting GET /todos/:id', async(done) => {
    const expected = {
      id: 4,
      todo: 'eat',
      completed: false,
      owner_id: 2,
    };
    const data = await fakeRequest(app)
      .get('/api/todos/:id')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(expected);
    done();
  });
  test('updates a single todo for the user when hitting PUT /todos/:id', async(done) => {
    const newTodo = {
      id: 4,
      todo: 'fart',
      completed: false,
      owner_id: 2,
    };
    const expectedAllTodos = [{
      id: 4,
      todo: 'fart',
      completed: false,
      owner_id: 2,
    }];
    const data = await fakeRequest(app)
      .put('/api/todos/:id')
      .send(newTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    const allTodos = await fakeRequest(app)
      .get('/api/todos/:id')
      .send(newTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(newTodo);
    expect(allTodos.body).toEqual(expectedAllTodos);
    done();
  });
  test('delete a single todo for the user when hitting DELETE /todos/:id', async(done) => {
    await fakeRequest(app)
      .delete('/api/todos/:id')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    const data = await fakeRequest(app)
      .get('/api/todos/:id')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual([]);
    done();
  });
});
