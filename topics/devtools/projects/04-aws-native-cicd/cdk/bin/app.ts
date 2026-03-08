#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CiCdStack } from '../lib/cicd-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

// 开发环境
new CiCdStack(app, 'AwsNativeCicdDev', {
  env,
  environment: 'dev',
  tags: {
    Project: 'aws-native-cicd',
    Environment: 'dev',
    ManagedBy: 'CDK',
  },
});

// 预发布环境
new CiCdStack(app, 'AwsNativeCicdStaging', {
  env,
  environment: 'staging',
  tags: {
    Project: 'aws-native-cicd',
    Environment: 'staging',
    ManagedBy: 'CDK',
  },
});

// 生产环境
new CiCdStack(app, 'AwsNativeCicdProd', {
  env,
  environment: 'prod',
  tags: {
    Project: 'aws-native-cicd',
    Environment: 'prod',
    ManagedBy: 'CDK',
  },
});

app.synth();
