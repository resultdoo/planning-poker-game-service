import { GraphQLClient } from 'graphql-request'

const HASURA_ENDPOINT = process.env.HASURA_ENDPOINT
const HASURA_SECRET = process.env.HASURA_SECRET

if ( ! HASURA_ENDPOINT ) {
	throw Error( "A GraphQL endpoint must be provided. Please set the HASURA_ENDPOINT environment variable." )
}

if ( ! HASURA_SECRET ) {
	throw Error( "Hasura Secret must be provided. Please set the HASURA_SECRET environment variable." )
}

const graphqlClient: GraphQLClient = new GraphQLClient( HASURA_ENDPOINT, {
	headers: {
		'x-hasura-admin-secret': HASURA_SECRET,
	}
})

export default graphqlClient