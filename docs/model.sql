-- 证书表
CREATE TABLE certificates (
    id TEXT PRIMARY KEY,
    namespace TEXT NOT NULL,
    type TEXT NOT NULL, -- ROOT, INTERMEDIATE, LEAF
    cert_pem TEXT NOT NULL, -- 证书内容 PEM 格式
    key_pem TEXT,          -- 私钥内容 PEM 格式
    updated_at INTEGER,
    created_at INTEGER,
    FOREIGN KEY(namespace) REFERENCES namespaces(id) ON DELETE CASCADE
);

-- 命名空间表
CREATE TABLE namespaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    updated_at INTEGER,
    created_at INTEGER
);

