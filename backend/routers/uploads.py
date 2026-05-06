"""
Uploads router — ShareLine

Endpoints:
    POST /uploads/presigned-url  — create a temporary S3 upload URL
    GET  /uploads/display-url    — create a temporary S3 display URL
"""

import os
import uuid
import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/uploads", tags=["uploads"])

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

BUCKET = os.getenv("S3_BUCKET_NAME")


class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str


@router.post("/presigned-url")
def create_presigned_upload_url(req: UploadUrlRequest):
    if not req.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    file_ext = req.filename.split(".")[-1]
    object_key = f"listing-images/{uuid.uuid4()}.{file_ext}"

    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET,
            "Key": object_key,
            "ContentType": req.content_type,
        },
        ExpiresIn=300,
    )

    return {
        "upload_url": upload_url,
        "object_key": object_key,
    }


@router.get("/display-url")
def get_display_url(object_key: str):
    display_url = s3.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": BUCKET,
            "Key": object_key,
        },
        ExpiresIn=3600,
    )

    return {"url": display_url}