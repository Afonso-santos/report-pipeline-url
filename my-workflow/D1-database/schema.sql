CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' -- e.g., 'pending', 'processing', 'completed', 'failed'
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id UUID NOT NULL,
    message TEXT NOT NULL, -- e.g., "Report created", "Processing started", "Processing completed", "Error: <error details>"
    FOREIGN KEY (report_id) REFERENCES reports(id)
);