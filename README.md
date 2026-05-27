# Report Pipeline API (Cloudflare Workers + D1 + Workflows)

This project is a serverless API built on Cloudflare Workers. It handles the submission of URLs, logs them into a D1 database, and triggers a background Cloudflare Workflow that waits for manual admin approval before updating the database.

## 🚀 Technologies Used
* **Cloudflare Workers:** Serverless edge compute for lightning-fast API responses.
* **Cloudflare D1:** Serverless SQLite database for storing reports and logs.
* **Cloudflare Workflows:** Durable background tasks with sleep states and manual event triggers.
* **TypeScript:** For strict typing and better developer experience.

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* npm (comes with Node.js)

## 🛠️ Local Setup & Installation

**1. Clone the repository and install dependencies**
```bash
git clone <your-repo-url>
cd <your-repo-name>
npm install
```

**2. Initialize the local D1 Database**
Cloudflare Wrangler uses a local version of D1 for testing. You need to create your tables first:
```bash

npx wrangler d1 execute prod_d1_database --local --command "CREATE TABLE IF NOT EXISTS reports (id UUID PRIMARY KEY, url TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending');"

npx wrangler d1 execute prod_d1_database --local --command "CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, report_id UUID NOT NULL, message TEXT NOT NULL, FOREIGN KEY (report_id) REFERENCES reports(id));"

```

** 3. Start the Development Server **
```bash
npm run dev
```

## Testing the API
**1. Create a New Report**
Submit a suspicious URL to the database. This will instantly return a 201 Created status and start a background workflow.

```bash
curl -X POST http://localhost:8787/report \
-H "Content-Type: application/json" \
-d '{"url": "[https://example-bad-site.com](https://example-bad-site.com)"}'
```

**2. Check the Report Status**
Verify that the report is in the database and currently marked as `pending`. Replace `<ID> `with the ID from the previous step.
```bash
curl http://localhost:8787/case/<ID>
```

**3. Approve the Report**
Send an approval signal. This wakes up the sleeping background workflow, which then updates the database statuses.

```bash
curl -X POST http://localhost:8787/approve/<ID>
```

**4. Verify Final Status**
Wait a couple of seconds for the background workflow to finish, then check the status again. It should now be `approved`!
```bash
curl http://localhost:8787/case/<ID>
```



## Future Work 
For future iterations of this project, I would focus heavily on security and validation. Currently, the API lacks authentication, meaning unauthorized external users can call the endpoints. To resolve this, I would implement an API key verification system. Additionally, the pipeline is missing input validation; I need to ensure the system strictly checks that the submitted data is a valid URL before creating a case. Finally, regarding the workflow, I set the timeout for manual approval to one week. This was an educated guess on what makes sense for a human-in-the-loop process, but in the future, I would want to base that timeout value on actual real-world response times.