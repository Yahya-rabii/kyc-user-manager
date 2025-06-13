const GenericApiHost = 'http://localhost';
const GenericApiPort = '8081';
const GenericApiUrl = `${GenericApiHost}:${GenericApiPort}`;

export const environment = {
  production: true,
  // auth microservice
  AuthapiUrl: `${GenericApiUrl}/api`,
  loginEndpoint: '/login',
  logoutEndpoint: '/logout',
  signupEndpoint: '/signup',
  refreshEndpoint: '/refresh',
  getRolesEndpoint: '/role',
  validateSecretEndpoint: '/verifySecret/',
  GetRealmsEndpoint: '/realms',

};
