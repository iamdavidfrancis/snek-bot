import DBService from './db-service.js';
import MailgunService from './mailgun-service.js';

export default class ServiceFactory {
  private static dbService: DBService;

  private static mailgunService: MailgunService;

  public static get DBServiceInstance(): DBService {
    if (!ServiceFactory.dbService) {
      ServiceFactory.dbService = new DBService();
      // eslint-disable-next-line promise/prefer-await-to-then, promise/prefer-await-to-callbacks
      ServiceFactory.dbService.initialize().catch((error) => {
        console.error('Failed to initialize DBService:', error);
      });
    }

    return ServiceFactory.dbService;
  }

  public static get MailgunServiceInstance(): MailgunService {
    if (!ServiceFactory.mailgunService) {
      ServiceFactory.mailgunService = new MailgunService();
    }

    return ServiceFactory.mailgunService;
  }
}
