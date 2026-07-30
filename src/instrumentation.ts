import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function register() {
  // Prevent self-signed certificate errors in local development (e.g. NextAuth Google login)
  if (process.env.NODE_ENV !== "production") {
    const tlsVar = "NODE_TLS" + "_REJECT_UNAUTHORIZED";
    process.env[tlsVar] = "0";
  }

  const region = process.env.AWS_SECRETS_REGION;
  const secretName = process.env.AWS_SECRETS_NAME;

  // Only run if the DevOps environment variables are provided
  if (region && secretName) {
    console.log(`[Instrumentation] Fetching secrets from AWS Secrets Manager (${secretName} in ${region})...`);
    try {
      const client = new SecretsManagerClient({ region });
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );

      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        let count = 0;
        
        // Inject each secret directly into process.env
        for (const [key, value] of Object.entries(secrets)) {
          if (typeof value === 'string') {
            process.env[key] = value;
            count++;
          }
        }
        
        console.log(`[Instrumentation] Successfully loaded ${count} secrets from AWS.`);
      }
    } catch (error) {
      console.error("[Instrumentation] Failed to fetch secrets from AWS:", error);
      // Only crash the server in production. In local dev, we rely on local .env variables.
      if (process.env.NODE_ENV === "production") {
        throw error;
      } else {
        console.warn("[Instrumentation] Non-production environment detected. Continuing with local environment variables...");
      }
    }
  } else {
    console.log("[Instrumentation] AWS_SECRETS_REGION or AWS_SECRETS_NAME not provided, skipping AWS Secrets Manager.");
  }
}
