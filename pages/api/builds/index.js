const db = require('../../../lib/db');
const { runPipeline } = require('../../../lib/pipeline');

export default async function handler(req, res) {
  db.initDb(); // Ensure DB is initialized
  
  if (req.method === 'GET') {
    try {
      const builds = db.getBuilds();
      return res.status(200).json(builds);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch builds" });
    }
  }
  
  if (req.method === 'POST') {
    try {
      console.log("Triggering pipeline execution...");
      let { success, log } = await runPipeline();
      
      // If the current pipeline state is fully green/successful, it means the previous challenge is resolved!
      // To provide a fresh, continuous learning lab, we autonomously inject a new, random failure scenario from our catalog.
      if (success) {
        const usecases = require('../../../lib/usecases');
        const possibleIds = ["A", "B", "C", "D", "E"];
        const randomId = possibleIds[Math.floor(Math.random() * possibleIds.length)];
        console.log(`[Dynamic Injector] Workspace is healthy. Injecting fresh failure: ${randomId}...`);
        usecases.injectScenario(randomId);
        
        // Re-execute pipeline on the newly injected failure
        const rerun = await runPipeline();
        success = rerun.success;
        log = rerun.log;
      }
      
      // Determine what target scenario we were testing based on log contents
      let scenario = "unknown";
      if (log.includes("SyntaxError")) {
        scenario = "Scenario B: Syntax Error";
      } else if (log.includes("ZeroDivisionError")) {
        scenario = "Scenario A: Cascading Shared Bug";
      } else if (log.includes("AssertionError: assert 20.0 == 40.0")) {
        scenario = "Scenario C: Logical Assertion Error";
      } else if (log.includes("TimeoutError: Connection pool exhausted")) {
        scenario = "Scenario D: Database Connection Timeout";
      } else if (log.includes("KeyError: 'meta'")) {
        scenario = "Scenario E: Payment Webhook KeyError";
      } else if (success) {
        scenario = "All Passed (Success)";
      }
      
      // Write the build record as FAILED — diagnosis is triggered by the user manually
      // via the "Run AI Diagnosis" button in the UI, NOT automatically here.
      const status = success ? "SUCCESS" : "FAILED";
      const newBuild = db.createBuild(status, log, scenario);
      
      console.log(`Build #${newBuild.id} created with status: ${status}. ${!success ? 'User can trigger AI diagnosis from the UI.' : ''}`);
      
      return res.status(201).json(newBuild);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to trigger pipeline build" });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
};
