const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const getUploadUrl = async (fileName, fileType) => {
  const command = new PutObjectCommand({
    Bucket:process.env.S3_BUCKET,
    Key: fileName,
    ContentType: fileType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = { getUploadUrl };
