import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client/core'
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { getMainDefinition } from "@apollo/client/utilities"
import { createApolloProvider } from '@vue/apollo-option'
import { createClient } from "graphql-ws"

const httpLink = new HttpLink({
    // You should use an absolute URL here
    uri: 'http://localhost:3000/graphql',
})

// Create the subscription websocket link
const wsLink = new GraphQLWsLink(
    createClient({
        url: 'ws://localhost:3000/subscriptions',
    })
)

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
    // split based on operation type
    ({ query }) => {
        const { kind, operation } = getMainDefinition(query)
        return kind === 'OperationDefinition' &&
            operation === 'subscription'
    },
    wsLink,
    httpLink
)

// Create the apollo client
const apolloClient = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    connectToDevTools: true,
})

// Create a provider
export const apolloProvider = createApolloProvider({
    defaultClient: apolloClient,
})
