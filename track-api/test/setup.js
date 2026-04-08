require('dotenv').config()
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'
const { MongoMemoryServer } = require('mongodb-memory-server')
const { mongoose, models } = require('track-data')
const { User, Track, Tracker, POI, Company } = models

let mongod

beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
})

beforeEach(async () => {
    await User.deleteMany()
    await Track.deleteMany()
    await Tracker.deleteMany()
    await POI.deleteMany()
    await Company.deleteMany()
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
})
