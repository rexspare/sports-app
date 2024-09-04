import { ApolloClient, InMemoryCache, from, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAccessToken } from '../storage';
import { isSimulator, isIos } from '../Utilities';

const authLink = (token: string | undefined) => setContext(async (_, { headers }) => {
  const accessToken = token ? token : await getAccessToken();
  // console.log("Request token: ", accessToken);
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `Bearer ${accessToken}` : '',
    }
  };
});

const uri = isSimulator() ? (
  isIos() ?
    `http://localhost:4060/gql`
    : `http://10.0.2.2:4060/gql`
)
  : "https://api.example.com/gql";

const httpLink = new HttpLink({ uri });

export const createApolloClient = (token: string | undefined) => new ApolloClient({
  uri,
  link: from([authLink(token), httpLink]),
  cache: new InMemoryCache()
});
