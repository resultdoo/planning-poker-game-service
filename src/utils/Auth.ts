import jwt from 'jsonwebtoken'

const privateKey: string | undefined = process.env.PRIVATE_KEY

if ( ! privateKey ) {
	throw Error( "You must provide private key." )
}

type AuthToken = {
	result?: ResultAuthToken
}

type ResultAuthToken = {
	'X-Hasura-Allowed-Roles': Array<string>,
	'X-Hasura-Role'?: string,
	'X-Hasura-User-Id'?: string,
	'X-Hasura-Room'?: string,
	'X-Hasura-Default-Role'?: string
}

class Auth {
	constructor() {}

	generateToken( role: string, userId: string, roomId: string, expiresIn = '8h' ): string {
		const data: AuthToken = {
			'result': {
				'X-Hasura-Allowed-Roles': [ 'owner', 'player' ],
				'X-Hasura-Default-Role': role,
				'X-Hasura-Role': role,
				'X-Hasura-User-Id': userId.toString(),
				'X-Hasura-Room': roomId
			}
		}

		if ( ! privateKey ) {
			throw Error( "No private key is set in container. Please set a private key." )
		}

		const token = jwt.sign( data, privateKey, { expiresIn, algorithm: 'RS256' } )

		return token
	}
}

const authInstance: Auth = new Auth()
Object.freeze( authInstance )

export default authInstance