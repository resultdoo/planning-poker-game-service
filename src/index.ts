import cluster from 'cluster'
import os from 'os'

import logger from './utils/Logger'
import App from './app'
import { GameController, CronController } from './routes'

process.on( "unhandledRejection", err => {
	throw err
} )

process.on( "uncaughtException", err => {
	console.error( "Uncaught excception", err )
} )

const initServer = () => {
	const port = process.env.PORT || 80

	const app = new App(
		[
			new GameController(),
			new CronController()
		],
		port
	)
	
	app.listen()
}

if ( process.env.BUILD_ENV === 'development' ) {
	initServer()
} else {
	const numberOfCPUs = os.cpus().length

	if ( cluster.isMaster ) {
		logger.info( `Master ${ process.pid } is running.` )

		for ( let i = 0; i < numberOfCPUs; i++ ) {
			cluster.fork()
		}

		cluster.on( 'exit', ( worker, code, signal ) => {
			logger.error( `Plan Poker game service ${ worker.process.pid } died.` )
			logger.error( `Code: ${ code }` )
            logger.error( `Signal: ${ signal }` )

			for ( const id in cluster.workers ) {
                const worker = cluster.workers[ id ]
                if ( worker ) {
                    worker.kill()
                }
			}
			process.exit( 0 )
		} )
	} else {
		process.on( 'exit', ( x ) => { console.log( 'exiting:', x ) } )
		initServer()
		logger.info( `Worker ${ process.pid } started.` )
	}
}