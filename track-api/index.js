require('./src/shared/load-env')()
const http = require('http')
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
const { mongoose } = require('track-data')
const errorMiddleware = require('./src/shared/error.middleware')

const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@as-integrations/express5')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const { makeExecutableSchema } = require('@graphql-tools/schema')

const identityRoutes = require('./src/identity/identity.routes')
const fleetRoutes    = require('./src/fleet/fleet.routes')
const trackingRoutes = require('./src/tracking/tracking.routes')
const { startSimulatorTrackRetentionJob } = require('./src/tracking/simulator-retention.job')
const poiRoutes      = require('./src/poi/poi.routes')

const resolvers   = require('./src/graphql/resolvers')
const { buildContext } = require('./src/graphql/context')

const { env: { PORT = 8080, MONGO_URL } } = process
const corsOriginEnv = process.env.CORS_ORIGINS

function buildCorsOptions() {
    if (!corsOriginEnv) return { origin: true, credentials: false }

    const allowlist = corsOriginEnv.split(',')
        .map(origin => origin.trim())
        .filter(Boolean)

    return {
        origin(origin, callback) {
            // Allow non-browser clients (no Origin header), block unknown browser origins.
            if (!origin || allowlist.includes(origin)) return callback(null, true)
            return callback(null, false)
        },
        credentials: false
    }
}

const corsOptions = buildCorsOptions()

const typeDefs = fs.readFileSync(path.join(__dirname, 'src/graphql/schema.graphql'), 'utf8')
const schema = makeExecutableSchema({ typeDefs, resolvers })

;(async () => {
    await mongoose.connect(MONGO_URL)
    startSimulatorTrackRetentionJob()

    const app = express()
    app.set('trust proxy', 1)
    app.use(cors(corsOptions))
    app.use(express.json())

    // REST routes — unchanged
    app.get('/api/health', (req, res) => res.json({ status: 'ok', version: pkg.version }))
    app.use('/api', identityRoutes)
    app.use('/api', fleetRoutes)
    app.use('/api', trackingRoutes)
    app.use('/api', poiRoutes)

    // HTTP server (required for WebSocket upgrades)
    const httpServer = http.createServer(app)

    // WebSocket server for GraphQL subscriptions
    const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' })
    const serverCleanup = useServer(
        {
            schema,
            context: (ctx) => buildContext({ connectionParams: ctx.connectionParams })
        },
        wsServer
    )

    // Apollo Server
    const apolloServer = new ApolloServer({
        schema,
        plugins: [
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose()
                        }
                    }
                }
            }
        ]
    })

    await apolloServer.start()

    app.use(
        '/graphql',
        cors(corsOptions),
        express.json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => buildContext({ req })
        })
    )

    app.use((req, res) => {
        res.status(404).json({ error: 'Not found.' })
    })
    app.use(errorMiddleware)

    httpServer.listen(PORT, () =>
        console.log(`${pkg.name} ${pkg.version} up on port ${PORT} — GraphQL at /graphql`)
    )
})()
