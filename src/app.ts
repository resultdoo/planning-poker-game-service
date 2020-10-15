import express, { Application } from 'express'
import bodyParser from 'body-parser'
import cors from "cors"

import logger from './utils/Logger'
import { Controller } from './routes'

class App {
	public app: Application
	public port: number | string

	constructor( controllers: Array<Controller>, port: number | string ) {
		this.app = express()
		this.port = port

		this.initializeMiddleware()
		this.initializeControllers( controllers )
	}

	private initializeMiddleware() {
		this.app.use(
			bodyParser.json( {
				limit: '5mb'
			} )
		)
		this.app.use( cors() )
	}

	private initializeControllers( controllers: Array<Controller> ) {
		controllers.forEach( ( controller: Controller ) => {
			this.app.use( '/', controller.router )
		} )
	}

	public listen() {
		this.app.listen( this.port, () => {
			logger.info( `Plan Poker Game Service listening on port ${ this.port } ...` )
		} )
	}
	
}

export default App