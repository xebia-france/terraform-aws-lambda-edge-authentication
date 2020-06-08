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
        this.callback = callback;
        this.requestUri = this.request.uri;
    }

    async handler(event, context, callback) {
        this.initEvent(event, callback);

        try {
            const redirectRules = await Utils.s3Read(this.bucketName, this.bucketKey); //await this.readConfig();
            const newUri = redirectRules[this.requestUri];

            console.log('URI requested:', this.requestUri);

            // Redirection
            if ( typeof newUri !== 'undefined'){
                return this.sendRedirection(newUri);
            };

            return this.callback(null, this.request);
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
    }

    private sendRedirection(newUri) {
        console.log('redirection send:', newUri);
        const response = {
            status: '301',
            statusDescription: 'Found',
            headers: {
                location: [{
                    key: 'Location',
                    value: newUri,
                }]
            }
        };
        return this.callback(null, response)
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
}
