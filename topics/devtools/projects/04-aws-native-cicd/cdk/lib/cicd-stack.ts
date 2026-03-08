import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface CiCdStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'prod';
}

export class CiCdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CiCdStackProps) {
    super(scope, id, props);

    const { environment } = props;
    const isProd = environment === 'prod';

    // =====================================================
    // 1. 基础网络资源
    // =====================================================
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // =====================================================
    // 2. ECR 仓库
    // =====================================================
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: `aws-native-cicd-${environment}`,
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: isProd ? 50 : 10,
          tagStatus: ecr.TagStatus.TAGGED,
          tagPrefixList: ['prod'],
        },
        {
          maxImageAge: cdk.Duration.days(isProd ? 90 : 7),
          tagStatus: ecr.TagStatus.UNTAGGED,
        },
      ],
      removalPolicy: isProd 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // =====================================================
    // 3. ECS Fargate 集群
    // =====================================================
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
      clusterName: `aws-native-cicd-${environment}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Fargate Spot 用于非生产环境
    if (!isProd) {
      cluster.addCapacity('SpotCapacity', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        spotPrice: '0.05',
        maxCapacity: 4,
      });
    }

    // =====================================================
    // 4. Application Load Balancer + Fargate Service
    // =====================================================
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'AppService',
      {
        cluster,
        serviceName: `app-service-${environment}`,
        cpu: isProd ? 512 : 256,
        memoryLimitMiB: isProd ? 1024 : 512,
        desiredCount: isProd ? 2 : 1,
        assignPublicIp: false,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
          containerName: 'app',
          containerPort: 8080,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: 'app',
            logRetention: isProd ? 30 : 3,
          }),
          environment: {
            NODE_ENV: environment,
            PORT: '8080',
          },
        },
        healthCheckGracePeriod: cdk.Duration.seconds(60),
        circuitBreaker: { rollback: true },
      }
    );

    // 健康检查配置
    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // Auto Scaling
    if (isProd) {
      const scaling = fargateService.service.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 10,
      });

      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      });

      scaling.scaleOnRequestCount('RequestScaling', {
        targetGroup: fargateService.targetGroup,
        requestsPerTarget: 1000,
      });
    }

    // =====================================================
    // 5. CodeCommit 仓库 (仅开发环境)
    // =====================================================
    let codeRepo: codecommit.Repository | undefined;
    if (environment === 'dev') {
      codeRepo = new codecommit.Repository(this, 'AppCodeRepo', {
        repositoryName: 'aws-native-cicd-app',
        description: 'Application source repository',
      });
    }

    // =====================================================
    // 6. CodeBuild 项目
    // =====================================================
    const buildProject = new codebuild.PipelineProject(
      this,
      'BuildProject',
      {
        projectName: `aws-native-cicd-build-${environment}`,
        description: `Build project for ${environment}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          privileged: true,
          computeType: isProd
            ? codebuild.ComputeType.LARGE
            : codebuild.ComputeType.MEDIUM,
        },
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          IMAGE_REPO_NAME: { value: repository.repositoryName },
          IMAGE_TAG: { value: environment },
          ENVIRONMENT: { value: environment },
        },
        cache: codebuild.Cache.local(
          codebuild.LocalCacheMode.SOURCE,
          codebuild.LocalCacheMode.DOCKER_LAYER
        ),
        timeout: cdk.Duration.minutes(30),
        buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
      }
    );

    // 授予 ECR 权限
    repository.grantPullPush(buildProject);

    // =====================================================
    // 7. CodePipeline
    // =====================================================
    const sourceArtifact = new codepipeline.Artifact('SourceOutput');
    const buildArtifact = new codepipeline.Artifact('BuildOutput');

    const pipeline = new codepipeline.Pipeline(this, 'AppPipeline', {
      pipelineName: `aws-native-cicd-${environment}`,
      restartExecutionOnUpdate: true,
      crossAccountKeys: false,
    });

    // Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub_Source',
          owner: 'your-github-org',
          repo: 'your-repo-name',
          branch: environment === 'prod' ? 'main' : 'develop',
          output: sourceArtifact,
          connectionArn: `arn:aws:codestar-connections:${this.region}:${this.account}:connection/YOUR_CONNECTION_ID`,
        }),
      ],
    });

    // Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceArtifact,
          outputs: [buildArtifact],
        }),
      ],
    });

    // Approval Stage (仅生产环境)
    if (isProd) {
      const approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
        topicName: 'pipeline-approval',
      });
      approvalTopic.addSubscription(
        new sns_subscriptions.EmailSubscription('ops@example.com')
      );

      pipeline.addStage({
        stageName: 'Approval',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'Approve_Deploy',
            notificationTopic: approvalTopic,
            additionalInformation: '请审批生产环境部署',
            externalEntityLink: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
          }),
        ],
      });
    }

    // Deploy Stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'Deploy_to_ECS',
          service: fargateService.service,
          imageFile: new codepipeline.ArtifactPath(
            buildArtifact,
            'imagedefinitions.json'
          ),
          deploymentTimeout: cdk.Duration.minutes(30),
        }),
      ],
    });

    // =====================================================
    // 8. 监控与告警
    // =====================================================
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `app-alarms-${environment}`,
    });

    // CPU 使用率告警
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      alarmName: `HighCPU-${environment}`,
      metric: fargateService.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // 内存使用率告警
    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      alarmName: `HighMemory-${environment}`,
      metric: fargateService.service.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // 5xx 错误告警
    const http5xxAlarm = new cloudwatch.Alarm(this, 'Http5xxAlarm', {
      alarmName: `Http5xx-${environment}`,
      metric: fargateService.loadBalancer.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT
      ),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    http5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Pipeline 失败告警
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `PipelineFailure-${environment}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'FailedExecutions',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
          statistic: cloudwatch.Statistic.SUM,
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // =====================================================
    // 9. CloudWatch Dashboard
    // =====================================================
    const dashboard = new cloudwatch.Dashboard(this, 'AppDashboard', {
      dashboardName: `aws-native-cicd-${environment}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU/Memory Utilization',
        left: [
          fargateService.service.metricCpuUtilization(),
          fargateService.service.metricMemoryUtilization(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [fargateService.loadBalancer.metrics.requestCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Response Time',
        left: [
          fargateService.loadBalancer.metrics.targetResponseTime(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'HTTP 4xx/5xx Errors',
        left: [
          fargateService.loadBalancer.metrics.httpCodeTarget(
            elbv2.HttpCodeTarget.TARGET_4XX_COUNT
          ),
          fargateService.loadBalancer.metrics.httpCodeTarget(
            elbv2.HttpCodeTarget.TARGET_5XX_COUNT
          ),
        ],
      })
    );

    // =====================================================
    // 10. 输出
    // =====================================================
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });

    if (codeRepo) {
      new cdk.CfnOutput(this, 'CodeCommitCloneUrl', {
        value: codeRepo.repositoryCloneUrlHttp,
        description: 'CodeCommit Repository Clone URL',
      });
    }

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://${this.region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
      description: 'CodePipeline Console URL',
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
