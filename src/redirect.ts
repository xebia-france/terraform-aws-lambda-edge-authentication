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
        console.log(JSON.stringify(cf, null, 4));
        this.request = cf.request;
        this.response = cf.response;
        this.callback = callback;
        this.requestUri = this.request.uri;
    }

    async handler(event, context, callback) {
        this.initEvent(event, callback);

        try {
            const jsonFile = await Utils.s3Read(this.bucketName, this.bucketKey); //await this.readConfig();
            const redirectRules = JSON.parse(jsonFile);
            let currentUri = this.requestUri;
            console.log('URI requested:', currentUri);

            // Cut off trailing slash to normalize it
            if (currentUri.slice(-1) === '/') {
                currentUri = currentUri.slice(0, -1);
                console.log('Cut off URI trailing slash:', currentUri);
            };

            // Compare URI with JSON key
            const newUri = redirectRules[currentUri];
            console.log('result from JSON:', newUri);
            if ( typeof newUri !== 'undefined'){
                return this.callback(null, this.sendRedirection(newUri));
            };

            // Return response if no need to redirect
            return this.callback(null, this.response);
        }
        catch (e) {
            console.error(e);
            return this.internalError();
        }
    }

    private sendRedirection(newUri) {
        console.log('URI returned:', newUri);
        this.response.headers['location'] = [{
            key: 'Location',
            value: newUri,
        }];
        return {
            status: '301',
            statusDescription: 'Found',
            headers: this.response.headers
        };
    }

    private internalError() {
        const response = {
            status: '500',
            statusDescription: 'Internal Error'
        };
        return this.callback(null, response);
    }
}
