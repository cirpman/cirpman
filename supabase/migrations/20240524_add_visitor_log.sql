CREATE TABLE visitors (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    person_visiting TEXT NOT NULL,
    department TEXT,
    purpose_of_visit TEXT,
    has_packages BOOLEAN DEFAULT FALSE,
    has_been_before BOOLEAN DEFAULT FALSE,
    notes TEXT,
    time_in DATETIME NOT NULL,
    time_out DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    signed_out_by TEXT
);
