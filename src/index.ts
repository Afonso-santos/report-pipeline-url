/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { MyWorkflow } from "./workflow";

export { MyWorkflow } from "./workflow";
export interface Env {
  prod_d1_database: D1Database;
  MY_WORKFLOW: Workflow; 
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
	const path = url.pathname
    

	if(request.method.toUpperCase() ==="POST" && path === "/report"){
		try {	
		const body = await request.json() as Record<string, unknown>;
		
		if (!body || typeof body.url !== "string") return Response.json({error: "URL not found"},{status:400});

		const ID = crypto.randomUUID();
		
		await env.prod_d1_database
		.prepare("INSERT INTO reports (id, url, status) VALUES (?, ?, 'pending')")
		.bind(ID, body.url)
		.run();

		await env.MY_WORKFLOW.create({
			id: ID,
			params: {
				id: ID,
				name: body.url
			}
		});
		
		return Response.json({id: ID, url: body.url, status: "pending"},{status:201});
		} catch (e) {
			return Response.json({error: "Server error"},{status:500});
		}


    } else if (request.method.toUpperCase() === "POST" && path.startsWith("/approve/")) {

		const id = path.split("/approve/")[1];

		const existingReport = await env.prod_d1_database
		.prepare("SELECT * FROM reports WHERE id = ?")
		.bind(id)
		.first();

		if (!existingReport) return Response.json({error: "Report not found"},{status:404});
		
		if (existingReport.status !== "pending") return Response.json({error: "Report is not pending"},{status:400});

		const instance = await env.MY_WORKFLOW.get(id);

		await instance.sendEvent({ type: "approval", payload: null });

		return Response.json({id: id, status: "approved"},{status:200});



    } else if (request.method.toUpperCase() === "GET" && path.startsWith("/case/")) {
		const id = path.split("/case/")[1];

		const caseData = await env.prod_d1_database
		.prepare("SELECT * FROM reports WHERE id = ?")
		.bind(id)
		.first();

		if (!caseData) return Response.json({error: "Report not found"},{status:404});
		
		return Response.json(caseData, {status:200});

	}

    // 4. Fallback response for requests that aren't POST /report
    // Workers must ALWAYS return a Response object
    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;