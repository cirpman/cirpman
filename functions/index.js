const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

admin.initializeApp();

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://b504159e8022ea6268f9390704f90c2f.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "55e08629b4b04123456c9baed894589e",
    secretAccessKey: "0d86ce6e19aa9c44ef20e8609ba65524ca40eba1b651e33f5c966ec76e794739",
  },
});

exports.getSignedUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { fileType, fileName } = data;
  const uid = context.auth.uid;

  const command = new PutObjectCommand({
    Bucket: "cirpman-homes-files",
    Key: `uploads/${uid}/${fileName}`,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { url };
});
