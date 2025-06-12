const GenericApiHost = 'http://localhost';
const GenericApiPort = '8888';
const GenericApiUrl = `${GenericApiHost}:${GenericApiPort}`;

export const environment = {
  production: true,
  // auth microservice
  AuthapiUrl: `${GenericApiUrl}/auth-service`,
  loginEndpoint: '/login',
  logoutEndpoint: '/logout',
  signupEndpoint: '/signup',
  refreshEndpoint: '/refresh',
  getRolesEndpoint: '/role',
  validateSecretEndpoint: '/verifySecret/',
  // client microservice
  ClientMsUrl: `${GenericApiUrl}/client-service`,
  getAllclientsEndpoint: '/clients',
  getClientByIdEndpoint: '/client/',
  createClientEndpoint: '/addClient',
  updateClientEndpoint: '/updateClient/',
  deleteClientEndpoint: '/deleteClient/',
  getcontractsByClientIdEndpoint: '/contracts/',
};
