"""
RAG 知识库助手 Lambda 函数
支持 Knowledge Base 检索 + LLM 生成
"""

import json
import boto3
import os
from typing import List, Dict
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 初始化客户端
bedrock_agent = boto3.client('bedrock-agent-runtime')
bedrock = boto3.client('bedrock-runtime')

# 配置
KNOWLEDGE_BASE_ID = os.environ['KNOWLEDGE_BASE_ID']
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-sonnet-20240229-v1:0')

def retrieve_documents(query: str, kb_id: str, num_results: int = 5) -> List[Dict]:
    """
    从 Knowledge Base 检索相关文档
    
    Args:
        query: 用户查询
        kb_id: Knowledge Base ID
        num_results: 返回结果数量
    
    Returns:
        相关文档列表
    """
    try:
        response = bedrock_agent.retrieve(
            knowledgeBaseId=kb_id,
            retrievalQuery={'text': query},
            retrievalConfiguration={
                'vectorSearchConfiguration': {
                    'numberOfResults': num_results,
                    'overrideSearchType': 'HYBRID'  # 混合搜索
                }
            }
        )
        
        results = []
        for retrieval_result in response['retrievalResults']:
            results.append({
                'content': retrieval_result['content']['text'],
                'source': retrieval_result.get('location', {}).get('s3Location', {}).get('uri', 'Unknown'),
                'score': retrieval_result.get('score', 0)
            })
        
        return results
    
    except Exception as e:
        logger.error(f"Retrieval error: {str(e)}")
        return []

def build_rag_prompt(question: str, documents: List[Dict]) -> str:
    """
    构建 RAG 提示词
    
    策略：
    1. 系统提示设定角色
    2. 提供检索到的上下文
    3. 明确要求引用来源
    4. 添加回答格式要求
    """
    
    # 构建上下文
    context_parts = []
    for i, doc in enumerate(documents, 1):
        context_parts.append(f"[Document {i}]\n{doc['content']}\nSource: {doc['source']}\n")
    
    context = "\n".join(context_parts)
    
    prompt = f"""你是一个专业的知识库助手。请基于以下参考资料回答用户问题。

## 参考资料
{context}

## 用户问题
{question}

## 回答要求
1. 基于提供的参考资料回答，不要编造信息
2. 如果资料不足以回答问题，请明确说明
3. 在回答中引用来源，格式为 [Doc X]
4. 保持回答简洁明了

请提供回答："""
    
    return prompt

def invoke_llm(prompt: str, model_id: str) -> str:
    """调用 LLM 生成回答"""
    
    body = {
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 2048,
        'temperature': 0.3,  # RAG 任务使用较低温度，更确定性
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ]
    }
    
    response = bedrock.invoke_model(
        modelId=model_id,
        body=json.dumps(body)
    )
    
    response_body = json.loads(response['body'].read())
    return response_body['content'][0]['text']

def lambda_handler(event, context):
    """
    Lambda 处理函数
    
    请求格式:
    {
        "question": "用户问题",
        "num_results": 5,  // 可选，默认 5
        "model": "claude-sonnet"  // 可选
    }
    """
    try:
        # 解析请求
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event
        
        question = body.get('question', '')
        num_results = body.get('num_results', 5)
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Question is required'})
            }
        
        logger.info(f"Processing question: {question}")
        
        # Step 1: 检索相关文档
        start_time = context.get_remaining_time_in_millis()
        documents = retrieve_documents(question, KNOWLEDGE_BASE_ID, num_results)
        retrieval_time = start_time - context.get_remaining_time_in_millis()
        
        if not documents:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'answer': '未在知识库中找到相关信息。',
                    'sources': [],
                    'retrieval_time_ms': abs(retrieval_time)
                })
            }
        
        # Step 2: 构建提示词
        prompt = build_rag_prompt(question, documents)
        
        # Step 3: 生成回答
        start_time = context.get_remaining_time_in_millis()
        answer = invoke_llm(prompt, MODEL_ID)
        generation_time = start_time - context.get_remaining_time_in_millis()
        
        # Step 4: 格式化返回
        sources = [
            {
                'content': doc['content'][:200] + '...',  # 摘要
                'source': doc['source'],
                'relevance_score': doc['score']
            }
            for doc in documents
        ]
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'answer': answer,
                'sources': sources,
                'metrics': {
                    'retrieval_time_ms': abs(retrieval_time),
                    'generation_time_ms': abs(generation_time),
                    'total_sources': len(documents),
                    'model': MODEL_ID
                }
            }, ensure_ascii=False)
        }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal error', 'message': str(e)})
        }

# 本地测试
if __name__ == '__main__':
    test_event = {
        'body': json.dumps({
            'question': '什么是 Amazon Bedrock?',
            'num_results': 3
        })
    }
    
    os.environ['KNOWLEDGE_BASE_ID'] = 'your-kb-id-here'
    
    result = lambda_handler(test_event, type('Context', (), {'get_remaining_time_in_millis': lambda self: 10000})())
    print(json.dumps(result, indent=2, ensure_ascii=False))
