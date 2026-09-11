export function generateDeployEcsWorkflow(config: {
  appName: string;
  region: string;
  containerPort?: number;
}): string {
  // const containerPort = config.containerPort ?? 3000;

  return `name: Deploy to ECS

on:
  push:
    branches: [main]

env:
  AWS_REGION: ${config.region}
  ECR_REPOSITORY: ${config.appName}
  ECS_SERVICE: ${config.appName}-service
  ECS_CLUSTER: ${config.appName}-cluster
  CONTAINER_NAME: ${config.appName}

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to ECR
        id: build-image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

      - name: Download task definition
        run: |
          aws ecs describe-task-definition --task-definition \${{ env.ECS_SERVICE }} \\
          --query taskDefinition > task-definition.json

      - name: Update ECS service
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition.json
          service: \${{ env.ECS_SERVICE }}
          cluster: \${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
`;
}