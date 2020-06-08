export class Utils {

    static async s3Read(bucketName: string, bucketKey: string): Promise<string> {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const params = {Bucket: bucketName, Key: bucketKey};
        const data = await s3.getObject(params).promise();
        return data.Body.toString();
    }
}
