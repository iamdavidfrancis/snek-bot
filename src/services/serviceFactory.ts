import MailgunService from "./mailgun-service";
import DBService from "./db-service";

export default class ServiceFactory {
    private static dbService: DBService;
    private static mailgunService: MailgunService;

    public static get DBServiceInstance(): DBService {
        if (!ServiceFactory.dbService) {
            ServiceFactory.dbService = new DBService();
            ServiceFactory.dbService.initialize();
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