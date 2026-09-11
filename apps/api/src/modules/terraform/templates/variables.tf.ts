export function generateVariablesTf(config: {
  appName: string;
  region: string;
}): string {
  return `variable "app_name" {
  description = "Application name"
  type        = string
  default     = "${config.appName}"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "${config.region}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 3000
}

variable "container_cpu" {
  description = "CPU units for the container (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of container instances"
  type        = number
  default     = 1
}
`;
}