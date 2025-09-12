import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/dev', (c) => {
  return c.text('Hello Divyansh!')
})

export default app
