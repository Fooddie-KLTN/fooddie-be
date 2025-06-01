// apolloClient.js
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const backendUrl = process.env.NEXT_PUBLIC_API_URL_DOMAIN_BE;
// Hàm nhận token (tùy bạn lưu ở đâu, ví dụ localStorage)
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token'); // hoặc lấy từ cookie
  }
  return null;
}

const httpLink = new HttpLink({
  uri: `${apiBaseUrl}/graphql`, // Đổi thành BE của bạn
  headers: {
    Authorization: getToken() ? `Bearer ${getToken()}` : '',
  },
});

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
      url: `ws://${backendUrl}/graphql`,
      connectionParams: () => ({
        Authorization: getToken() ? `Bearer ${getToken()}` : '',
      }),
    }))
  : null;

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      httpLink,
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});