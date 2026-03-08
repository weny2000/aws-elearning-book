"""SAM Pipeline Example - Lambda Handler"""
import json
import os
import logging
from datetime import datetime
import boto3

logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])


def lambda_handler(event, context):
    """Main Lambda handler"""
    logger.info(f"Received event: {json.dumps(event)}")
    
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    try:
        if http_method == 'GET' and path == '/health':
            return response(200, {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})
        else:
            return response(404, {'error': 'Not found'})
    except Exception as e:
        logger.exception("Error")
        return response(500, {'error': str(e)})


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(body)
    }
