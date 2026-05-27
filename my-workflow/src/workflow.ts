import { WorkflowEntrypoint, WorkflowStep } from "cloudflare:workers";
import type { WorkflowEvent } from "cloudflare:workers";

type Params = {id: string; name?: string };

export interface Env {
  prod_d1_database: D1Database;
  MY_WORKFLOW: Workflow<MyWorkflow>;
}


export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {


    await step.do("log insert event", async () => {

      await this.env.prod_d1_database
        .prepare("INSERT INTO logs (report_id, message) VALUES (?, ?)")
        .bind(event.payload.id, "Report created") 
        .run();
        
    });

    try {
      await step.waitForEvent("manual approval",{
        type: "approval",
        timeout: "7 days",
      });

      await step.do("update report status to approved", async () => {

        await this.env.prod_d1_database.batch([
          this.env.prod_d1_database
            .prepare("UPDATE reports SET status = 'approved' WHERE id = ?")
            .bind(event.payload.id),
          this.env.prod_d1_database
            .prepare("INSERT INTO logs (report_id, message) VALUES (?, ?)")
            .bind(event.payload.id, "Report approved"),
        ]);

      });

    } catch (e) {

        await this.env.prod_d1_database.batch([
          this.env.prod_d1_database
            .prepare("UPDATE reports SET status = 'timed_out' WHERE id = ?")
            .bind(event.payload.id),
          this.env.prod_d1_database
            .prepare("INSERT INTO logs (report_id, message) VALUES (?, 'timed out')")
            .bind(event.payload.id),
        ]);
    }




    return "Workflow completed successfully";
  }
}