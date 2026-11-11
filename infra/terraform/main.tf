# Optional AWS image CDN foundation. Not required for local development.
# Run only after configuring AWS credentials, the AWS CLI and a unique bucket name.
terraform {
  required_version = ">= 1.5.0"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}
provider "aws" { region = var.aws_region }
variable "aws_region" { type = string, default = "eu-central-1" }
variable "bucket_name" { type = string }
resource "aws_s3_bucket" "photos" { bucket = var.bucket_name }
resource "aws_s3_bucket_public_access_block" "photos" {
  bucket = aws_s3_bucket.photos.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  bucket = aws_s3_bucket.photos.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}
resource "aws_cloudfront_origin_access_control" "photos" {
  name = "photo-cdn-oac"
  description = "Access private photos bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}
resource "aws_cloudfront_distribution" "photos" {
  enabled = true
  origin {
    domain_name = aws_s3_bucket.photos.bucket_regional_domain_name
    origin_id = "s3-photos"
    origin_access_control_id = aws_cloudfront_origin_access_control.photos.id
  }
  default_cache_behavior {
    allowed_methods = ["GET", "HEAD"]
    cached_methods = ["GET", "HEAD"]
    target_origin_id = "s3-photos"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
    min_ttl = 0
    default_ttl = 86400
    max_ttl = 31536000
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}
data "aws_iam_policy_document" "photos" {
  statement {
    actions = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.photos.arn}/*"]
    principals { type = "Service", identifiers = ["cloudfront.amazonaws.com"] }
    condition {
      test = "StringEquals"
      variable = "AWS:SourceArn"
      values = [aws_cloudfront_distribution.photos.arn]
    }
  }
}
resource "aws_s3_bucket_policy" "photos" {
  bucket = aws_s3_bucket.photos.id
  policy = data.aws_iam_policy_document.photos.json
  depends_on = [aws_s3_bucket_public_access_block.photos]
}
output "cloudfront_domain" { value = aws_cloudfront_distribution.photos.domain_name }
output "bucket_name" { value = aws_s3_bucket.photos.bucket }
