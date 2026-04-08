require('dotenv').config()
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'
const { MongoMemoryServer } = require('mongodb-memory-server')
const { mongoose } = require('track-data')

let mongod

beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
})
