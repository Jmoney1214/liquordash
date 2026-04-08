import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { agentConfig } from "./agent-config";

/**
 * Creates or updates an ElevenLabs Conversational AI agent.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk-... npx tsx src/setup/create-agent.ts
 *
 * If ELEVENLABS_AGENT_ID is set, updates the existing agent via PATCH.
 * Otherwise, creates a new agent via POST and prints the new agent_id.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_BASE = "https://api.elevenlabs.io/v1/convai";

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("Error: ELEVENLABS_API_KEY environment variable is required.");
    process.exit(1);
  }

  const existingAgentId = process.env.ELEVENLABS_AGENT_ID;
  const headers: Record<string, string> = {
    "xi-api-key": apiKey,
    "Content-Type": "application/json",
  };

  // Upload knowledge base files
  console.log("Uploading knowledge base files...");
  const kbDir = path.join(__dirname, "knowledge-base");
  const kbFiles = ["store-policies.md", "delivery-zones.md"];
  const uploadedFileIds: string[] = [];

  for (const filename of kbFiles) {
    const filePath = path.join(kbDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Warning: ${filename} not found, skipping.`);
      continue;
    }

    const formData = new FormData();
    const fileContent = fs.readFileSync(filePath);
    formData.append("file", new Blob([fileContent]), filename);

    try {
      const uploadRes = await fetch(`${API_BASE}/knowledge-base`, {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: formData,
      });

      if (uploadRes.ok) {
        const result = (await uploadRes.json()) as { id: string };
        uploadedFileIds.push(result.id);
        console.log(`  Uploaded ${filename} → ${result.id}`);
      } else {
        const err = await uploadRes.text();
        console.warn(`  Failed to upload ${filename}: ${err}`);
      }
    } catch (error) {
      console.warn(`  Error uploading ${filename}:`, error);
    }
  }

  // Attach knowledge base IDs to config
  const config = {
    ...agentConfig,
    knowledge_base: uploadedFileIds.map((id) => ({ type: "file", id })),
  };

  if (existingAgentId) {
    // Update existing agent
    console.log(`\nUpdating agent ${existingAgentId}...`);
    const res = await fetch(`${API_BASE}/agents/${existingAgentId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(config),
    });

    if (res.ok) {
      console.log(`Agent ${existingAgentId} updated successfully.`);
    } else {
      const err = await res.text();
      console.error(`Failed to update agent: ${err}`);
      process.exit(1);
    }
  } else {
    // Create new agent
    console.log("\nCreating new agent...");
    const res = await fetch(`${API_BASE}/agents/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(config),
    });

    if (res.ok) {
      const result = (await res.json()) as { agent_id: string };
      console.log(`\nAgent created successfully!`);
      console.log(`Agent ID: ${result.agent_id}`);
      console.log(`\nNext steps:`);
      console.log(`  1. Add to your .env: ELEVENLABS_AGENT_ID=${result.agent_id}`);
      console.log(`  2. Configure Twilio SIP trunk to point to this agent`);
      console.log(`  3. Deploy the Cloudflare Worker: npm run deploy`);
    } else {
      const err = await res.text();
      console.error(`Failed to create agent: ${err}`);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
