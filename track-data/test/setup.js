const { MongoMemoryServer } = require('mongodb-memory-server')
const { mongoose } = require('../index')

let mongod

beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
})

afterEach(async () => {
    // Clear all collections between tests to isolate state
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
})
