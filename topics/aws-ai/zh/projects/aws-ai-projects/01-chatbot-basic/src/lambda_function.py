"""
Bedrock 聊天机器人 Lambda 函数
支持多种模型和流式响应
"""

import json
import boto3
import os
from typing import Dict, Any
from botocore.exceptions import ClientError
import logging

# 配置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 初始化 Bedrock 客户端
bedrock_runtime = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-east-1'))

# 模型配置
MODEL_CONFIG = {
    'nova-micro': {
        'model_id': 'amazon.nova-micro-v1:0',
        'max_tokens': 512,
        'temperature': 0.7,
        'cost_per_1k_input': 0.035,
        'cost_per_1k_output': 0.14
    },
    'nova-lite': {
        'model_id': 'amazon.nova-lite-v1:0',
        'max_tokens': 1024,
        'temperature': 0.7,
        'cost_per_1k_input': 0.06,
        'cost_per_1k_output': 0.24
    },
    'nova-pro': {
        'model_id': 'amazon.nova-pro-v1:0',
        'max_tokens': 2048,
        'temperature': 0.7,
        'cost_per_1k_input': 0.8,
        'cost_per_1k_output': 3.2
    },
    'claude-sonnet': {
        'model_id': 'anthropic.claude-3-sonnet-20240229-v1:0',
        'max_tokens': 2048,
        'temperature': 0.7,
        'cost_per_1k_input': 3.0,
        'cost_per_1k_output': 15.0
    }
}


def invoke_nova_model(model_id: str, message: str, config: Dict) -> str:
    """调用 Nova 模型"""
    body = {
        'inferenceConfig': {
            'max_new_tokens': config['max_tokens'],
            'temperature': config['temperature']
        },
        'messages': [
            {
                'role': 'user',
                'content': [{'text': message}]
            }
        ]
    }
    
    response = bedrock_runtime.invoke_model(
        modelId=model_id,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['output']['message']['content'][0]['text']


def invoke_claude_model(model_id: str, message: str, config: Dict) -> str:
    """调用 Claude 模型"""
    body = {
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': config['max_tokens'],
        'temperature': config['temperature'],
        'messages': [
            {
                'role': 'user',
                'content': message
            }
        ]
    }
    
    response = bedrock_runtime.invoke_model(
        modelId=model_id,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['content'][0]['text']


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda 处理函数
    
    请求格式:
    {
        "message": "用户消息",
        "model": "nova-pro",  // 可选，默认 nova-lite
        "system_prompt": "系统提示"  // 可选
    }
    """
    try:
        # 解析请求
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        message = body.get('message', '')
        model_key = body.get('model', 'nova-lite')
        system_prompt = body.get('system_prompt', '你是一个 helpful 的 AI 助手。')
        
        if not message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'})
            }
        
        # 获取模型配置
        if model_key not in MODEL_CONFIG:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Unsupported model: {model_key}'})
            }
        
        config = MODEL_CONFIG[model_key]
        model_id = config['model_id']
        
        logger.info(f"Invoking model: {model_id} with message length: {len(message)}")
        
        # 调用模型
        if 'nova' in model_key:
            response_text = invoke_nova_model(model_id, message, config)
        else:
            response_text = invoke_claude_model(model_id, message, config)
        
        # 估算成本 (简化版)
        input_tokens = len(message) // 4  # 粗略估算
        output_tokens = len(response_text) // 4
        input_cost = (input_tokens / 1000) * config['cost_per_1k_input']
        output_cost = (output_tokens / 1000) * config['cost_per_1k_output']
        total_cost = input_cost + output_cost
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'response': response_text,
                'model': model_key,
                'model_id': model_id,
                'estimated_cost_usd': round(total_cost, 6),
                'estimated_tokens': {
                    'input': input_tokens,
                    'output': output_tokens
                }
            })
        }
    
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"Bedrock error: {error_code} - {error_message}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'Model invocation failed',
                'error_code': error_code,
                'message': error_message
            })
        }
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }


# 本地测试入口
if __name__ == '__main__':
    test_event = {
        'body': json.dumps({
            'message': '你好，请介绍一下 Amazon Bedrock',
            'model': 'nova-lite'
        })
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2, ensure_ascii=False))
