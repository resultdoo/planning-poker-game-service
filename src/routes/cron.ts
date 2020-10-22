import express, { Request, Response, Router } from 'express'
import graphqlClient from '../utils/GQLClient'
import BaseController from './base'

class CronController extends BaseController {
    public path = '/cron'
    public router: Router = express.Router()

    constructor() {
        super()
        this.initializeRoutes()
    }

    public initializeRoutes(): void {
        this.router.post( `${ this.path }/clear`, this.clear )
    }

    public clear = async ( req: Request, res: Response ): Promise<Response> => {
        this.logger.info( `Clearing old games ...` )

        let timestamp = new Date()
        timestamp.setHours( timestamp.getHours() - 8 )
    
        const deleteOldRooms = `
            mutation deleteOldRooms( $updatedAt: timestamptz! ) {
                delete_rooms( where: { updated_at: { _lt: $updatedAt } } ) {
                    affected_rows
                }
            }
        `
    
        await graphqlClient.request( deleteOldRooms, { updatedAt: timestamp } )
    
        this.logger.info( `Old games cleared ...` )
    
        return res.json( {
            success: true
        } )
    
    }
}

export default CronController