import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

if (!process.env.GCP_PROJECT) {
  throw new Error("GCP PROJECT variable is not defined!");
}
const GCP_PROJECT = process.env.GCP_PROJECT;

//const secretClient: SecretManagerServiceClient = new SecretManagerServiceClient();

export async function getSecrets(names: string[]): Promise<string[]> {
  return Promise.all(
    names.map(async name => {
      const secret = await accessSecret(name);
      if (!secret) {
        throw new Error("Missing GCP Secret Value!");
      }
      return secret;
    }),
  );
}

async function accessSecret(name: string): Promise<string | undefined> {
  return process.env[name]; // REMOVE
  /* ||(
      await secretClient.accessSecretVersion({
        name: `projects/${GCP_PROJECT ?? ""}/secrets/${name}/versions/latest`,
      })
    )?.[0]?.payload?.data?.toString() */
}
