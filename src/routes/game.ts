import express, { Request, Response, Router } from 'express'
import randomize from 'randomatic'
import { ActionParser, EventParser } from '@result/hasura-parser'

import graphqlClient from '../utils/GQLClient'
import Auth from '../utils/Auth'
import BaseController from './base'

class GameController extends BaseController {
    public path = '/game'
    public router: Router = express.Router()

    constructor() {
		super()
        this.initializeRoutes()
    }

    public initializeRoutes(): void {
        this.router.post( `${ this.path }/first_card`, this.firstCard )
        this.router.post( `${ this.path }/join`, this.joinGame )
        this.router.post( `${ this.path }/create`, this.createGame )
        this.router.post( `${ this.path }/togglecards`, this.toggleCards )
        this.router.post( `${ this.path }/end_round`, this.endRound )
	}
	
    private async firstCard( req: Request, res: Response ): Promise<Response> {
		const event = new EventParser( req.body )
		const { id, room_id } = event.getData( 'id', 'room_id' )

		const query = `
			mutation updateCards( $userId: bigint!, $roomId: bigint! ) {
				insert_scrum_cards_one( object: { user_id: $userId, room_id: $roomId } ) {
					id
				}
			}
		`
	
		await graphqlClient.request( query, { userId: id, roomId: room_id } )
	
		return res.json( {
			success: true
		} )		
	}

	private async joinGame( req: Request, res: Response ): Promise<Response> {
		const action = new ActionParser( req.body )
		const { fullName, roomCode } = action.getData( 'fullName', 'roomCode' )
	
		const checkRoomQuery = `
			query getRoomByCode( $roomCode: String ) {
				rooms( where: { room_code: { _eq: $roomCode } } ) {
					id
				  }
			}
		`
	
		const roomData: any = await graphqlClient.request( checkRoomQuery, { roomCode } )
		
		if ( roomData.rooms.length > 0 ) {
			const insertUserIntoRoom = `
				mutation insertUserIntoRoom( $fullName: String, $roomId: bigint ) {
					insert_users_one( object: { room_id: $roomId, full_name: $fullName } ) {
						id
					}
				}
			`
	
			const user: any = await graphqlClient.request( insertUserIntoRoom, { roomId: roomData.rooms[ 0 ].id, fullName } )
	
			const token = Auth.generateToken( 'player', user.insert_users_one.id, roomCode )
	
			return res.json( {
				token,
				userId: user.insert_users_one.id,
				roomId: roomData.rooms[ 0 ].id,
				roomCode
			} )
		}
	
		return res.status( 400 ).json( {
			message: 'Room does not exist or has expired.'
		} )	

	}

	private async createGame( req: Request, res: Response ): Promise<Response> {
		const action = new ActionParser( req.body )
		const { fullName } = action.getData( 'fullName' )


		const roomCode: string = randomize( 'A', 4 )
	
		const query = `
			mutation insertRoom( $roomCode: String ) {
				insert_rooms_one( object: { room_code: $roomCode } ) {
					id,
					room_code,
					created_at
				}
			}
		`
	
		let gameRoom: any = undefined
	
		try {
			gameRoom = await graphqlClient.request( query, { roomCode: roomCode } )
		} catch ( err ) {
			this.logger.error( `An error occured in room creation: `, err )
			return res.status( 400 ).json( {
				message: 'Something went horribly wrong!'
			} )
		} finally {
			if ( gameRoom ) {
				const userInsert = `
					mutation insertUserIntoRoom( $fullName: String, $roomId: bigint ) {
						insert_users_one( object: { full_name: $fullName, room_id: $roomId } ) {
							id
						}
					}
				`
				const user: any = await graphqlClient.request( userInsert, { fullName, roomId: gameRoom.insert_rooms_one.id } )
	
				const token = Auth.generateToken( 'owner', user.insert_users_one.id, gameRoom.insert_rooms_one.room_code )
	
				return res.json( {
					token,
					  userId: user.insert_users_one.id,
					  roomId: gameRoom.insert_rooms_one.id,
					  roomCode: gameRoom.insert_rooms_one.room_code
				} )
			} else {
				return res.json( {
					success: false
				} )
			}
		}	
	}

	private async toggleCards( req: Request, res: Response ): Promise<Response> {
		const action = new ActionParser( req.body )
		const { roomCode, show } = action.getData( 'roomCode', 'show' )

		const query = `
			mutation updateCards( $roomCode: String!, $showCards: Boolean! ) {
				update_scrum_cards(_set: { show: $showCards }, where: { room: { room_code: { _eq: $roomCode } } } ) {
					affected_rows
				}	
			}
		`
	
		await graphqlClient.request( query, { roomCode, showCards: show } )
	
		return res.json({
			success: true
		})	
	}

	private async endRound( req: Request, res: Response ): Promise<Response> {
		const action = new ActionParser( req.body )
		const { roomCode } = action.getData( 'roomCode' )

		const query = `
			mutation updateCards( $roomCode: String! ) {
				update_scrum_cards(_set: { card_value: null, show: false }, where: { room: { room_code: { _eq: $roomCode } } } ) {
					affected_rows
				}	
			}
		`
	
		await graphqlClient.request( query, { roomCode } )
	
		return res.json( {
			success: true
		} )	
	}



}

export default GameController