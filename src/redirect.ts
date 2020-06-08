import {readFileSync} from "fs";
import {resolve} from "path";
import {assign, isArray, extend, find} from 'lodash';
import {Utils} from "./utils";


export class Redirect {

    private bucketName: string;
    private bucketKey: string;

    private request: any;
    private response: any;
    private callback: any;

    private eventType: string;
    private requestUri: string;

    constructor() {
        const path = resolve("params.json");
        let text = readFileSync(path).toString();
        const params = JSON.parse(text);
        assign(this, params);
    }

    private initEvent(event: any, callback: any) {
        const cf = event.Records[0].cf;
        this.request = cf.request;
        this.response = cf.response;
        this.eventType = cf.config.eventType;
        this.callback = callback;
        this.requestUri = this.request.uri;
    }

    async handler(event, context, callback) {
        this.initEvent(event, callback);

        try {
            const redirectRules = await Utils.s3Read(this.bucketName, this.bucketKey); //await this.readConfig();
            const redirectUri = redirectRules[this.requestUri];

            console.log('URI requested', this.requestUri);

            if ( redirectUri !== 'undefined'){
                console.log('redirection send', redirectUri);
                this.response = {
                    status: '301',
                    statusDescription: 'Found',
                    headers: {
                        location: [{
                            key: 'Location',
                            value: redirectUri,
                        }]
                    }
                };
            }
            return this.redirect();
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
    }

    private redirect() {
        const reply = this.isResponse ? this.response : this.request;
        return this.callback(null, reply);
    }

    private internalError() {
        const body = 'Internal Error. Check Log for more details.';
        const response = {
            status: '500',
            statusDescription: 'Internal Error',
            body: body
        };
        return this.callback(null, response);
    }

    get isResponse(): boolean {
        return this.eventType.endsWith('response');
    }
}
