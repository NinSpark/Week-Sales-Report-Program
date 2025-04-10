require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());

// Database Configuration
const kaiShenConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false, // Disable encryption
        trustServerCertificate: true, // Trust the self-signed SSL certificate
        enableArithAbort: true,
    }
};

const lensoConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_LENSO,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false, // Disable encryption
        trustServerCertificate: true, // Trust the self-signed SSL certificate
        enableArithAbort: true,
    }
};

const loginPool = new Pool({
    host: "192.168.0.254",
    port: 5432,
    user: "postgres",
    password: "Director1",
    database: "postgres",
});

// Create connection pools for both databases
const kaiShenPool = new sql.ConnectionPool(kaiShenConfig).connect();
const lensoPool = new sql.ConnectionPool(lensoConfig).connect();

// Function to get the correct pool
async function getDBPool(dbType) {
    return dbType === 'lenso' ? lensoPool : kaiShenPool;
}

// Test Database Connection
async function testDBConnection() {
    try {
        await sql.connect(kaiShenConfig);
        console.log("✅ Kai Shen Database connected successfully!");
    } catch (err) {
        console.error("❌ Kai Shen Database connection failed:", err.message);
    }
}
// Test Database Connection
async function testDBConnection2() {
    try {
        await sql.connect(lensoConfig);
        console.log("✅ Lenso Database connected successfully!");
    } catch (err) {
        console.error("❌ Lenso Database connection failed:", err.message);
    }
}
// Test Database Connection
async function testDBConnection3() {
    loginPool.connect()
        .then(() => console.log('✅ Connected to PostgreSQL successfully!'))
        .catch(err => console.error('❌ Error connecting to PostgreSQL:', err));
}

// API to fetch unique SalesAgents for dropdown
app.get('/api/sales-agents', async (req, res) => {
    try {
        const result = await sql.query`SELECT DISTINCT SalesAgent FROM dbo.IV WHERE SalesAgent IS NOT NULL`;
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching SalesAgents:', err);
        res.status(500).send('Server error');
    }
});

// Fetch invoices for logged-in SalesAgent
app.get('/api/invoices', async (req, res) => {
    try {
        const salesAgent = req.query.salesAgent;
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        if (!salesAgent) {
            return res.status(400).json({ error: 'Missing SalesAgent parameter' });
        }

        const pool = await getDBPool(dbType);
        const request = pool.request();
        request.input('salesAgent', sql.NVarChar, salesAgent);

        const query = `SELECT DocKey, DocNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName, ShipInfo, DeliverAddr1
                   FROM dbo.IV WHERE SalesAgent = @salesAgent 
                   AND DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)
                   AND Cancelled = 'F'`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).send('Server error');
    }
});

// **Get invoice details from dbo.IVDTL based on DocKey**
app.get('/api/invoice-details', async (req, res) => {
    try {
        const docKey = req.query.docKey;
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        if (!docKey) {
            return res.status(400).send('Missing docKey parameter');
        }

        const pool = await getDBPool(dbType);
        const request = pool.request();
        request.input('docKey', sql.Int, docKey);

        const result = await request.query(`
            SELECT ItemCode, Description, ProjNo, UOM, Qty, SmallestQty, UnitPrice, SubTotal
            FROM dbo.IVDTL
            WHERE DocKey = @docKey
            AND ItemCode NOT LIKE 'Z%'
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching invoice details:', err);
        res.status(500).send('Server error');
    }
});

app.get("/filtered-invoices", async (req, res) => {
    try {
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        const pool = await getDBPool(dbType);

        const { salesAgent, startDate, endDate, shipInfo } = req.query;
        let shipInfoList = JSON.parse(shipInfo);

        let query = `
            SELECT i.DocKey, i.DocNo, i.DebtorName, i.ShipInfo, i.DocDate, i.BranchCode, i.DeliverAddr1,
                   d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ProjNo, d.ItemCode
            FROM IV i
            JOIN IVDTL d ON i.DocKey = d.DocKey
            WHERE i.SalesAgent = @salesAgent
            AND i.DocDate BETWEEN @startDate AND @endDate
            AND i.Cancelled = 'F'
            AND ItemCode NOT LIKE 'Z%'`;

        if (dbType == 'kai_shen' && shipInfoList.length > 0) {
            query += ` AND i.ShipInfo IN (${shipInfoList.map((_, i) => `@ship${i}`).join(",")})`;
        }

        const request = pool.request();
        request.input("salesAgent", sql.VarChar, salesAgent);
        request.input("startDate", sql.Date, startDate);
        request.input("endDate", sql.Date, endDate);
        if (dbType == 'kai_shen') shipInfoList.forEach((value, index) => request.input(`ship${index}`, sql.VarChar, value));

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Error retrieving invoices.");
    }
});

// API: Get CNs for Current Week
app.get('/api/credit-notes', async (req, res) => {
    try {
        const salesAgent = req.query.salesAgent;
        const dbType = req.query.db; // 'kai_shen' or 'lenso'

        if (!salesAgent) {
            return res.status(400).json({ error: 'Missing SalesAgent parameter' });
        }

        const query = `SELECT DocNo, OurInvoiceNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName, DocStatus, DeliverAddr1
                       FROM dbo.CN 
                       WHERE SalesAgent = @salesAgent
                       AND DocStatus = 'A'
                       AND CNType = 'RETURN' 
                       AND Cancelled = 'F'
                       AND DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`;

        const pool = await getDBPool(dbType);
        const request = pool.request();
        request.input('salesAgent', sql.NVarChar, salesAgent);

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching Credit Note:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// **Get CN details from dbo.CNDTL based on DocKey**
app.get('/api/credit-note-details', async (req, res) => {
    try {
        const docKey = req.query.docKey;
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        if (!docKey) {
            return res.status(400).send('Missing docKey parameter');
        }

        const pool = await getDBPool(dbType);
        const request = pool.request();
        request.input('docKey', sql.Int, docKey);

        const result = await request.query(`SELECT DocKey, ItemCode, Description, ProjNo, Qty, SmallestQty, SubTotal, AccNo FROM dbo.CNDTL 
                     WHERE DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching credit notes:', err);
        res.status(500).send('Server error');
    }
});

app.get("/filtered-credit-notes", async (req, res) => {
    try {
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        const pool = await getDBPool(dbType);

        const { salesAgent, startDate, endDate, shipInfo } = req.query;
        let refList = JSON.parse(shipInfo);

        let query = `
            SELECT i.DocKey, i.DocNo, i.DebtorName, i.DocDate, i.SalesAgent, i.CNType, i.Ref, i.BranchCode, i.DeliverAddr1,
                   d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ItemCode, d.UOM, d.UnitPrice, d.ProjNo
            FROM CN i
            JOIN CNDTL d ON i.DocKey = d.DocKey
            WHERE i.SalesAgent = @salesAgent
            AND i.DocStatus = 'A'
            AND i.CNType = 'RETURN'
            AND i.Cancelled = 'F'
            AND i.DocDate BETWEEN @startDate AND @endDate`;

        if (dbType == 'kai_shen' && refList.length > 0) {
            query += ` AND i.Ref IN (${refList.map((_, i) => `@ship${i}`).join(",")})`;
        }

        const request = pool.request();
        request.input("salesAgent", sql.VarChar, salesAgent);
        request.input("startDate", sql.Date, startDate);
        request.input("endDate", sql.Date, endDate);
        if (dbType == 'kai_shen') refList.forEach((value, index) => request.input(`ship${index}`, sql.VarChar, value));

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Error retrieving invoices.");
    }
});

// **Get Branch details from dbo.Branch based on Branch Code**
app.get('/api/get-branch-details', async (req, res) => {
    try {
        const branchCode = req.query.branchCode;
        const deliverAddr1 = req.query.deliverAddr1;
        const dbType = req.query.db; // 'kai_shen' or 'lenso'
        if (!branchCode) {
            return res.status(400).send('Missing branchCode parameter');
        }
        if (!deliverAddr1) {
            return res.status(400).send('Missing branchCode parameter');
        }

        const pool = await getDBPool(dbType);
        const request = pool.request();
        request.input('branchCode', sql.VarChar, branchCode);
        request.input('deliverAddr1', sql.VarChar, deliverAddr1);

        const result = await request.query(`SELECT * FROM dbo.Branch WHERE BranchCode = @branchCode AND Address1 = @deliverAddr1`);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching branch details:', err);
        res.status(500).send('Server error');
    }
});

// Get sales login by username and password
app.get("/sales-login", async (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const result = await loginPool.query(
            "SELECT username, password FROM sales_report_login WHERE username = $1 AND password = $2",
            [username, password]
        );

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("Error fetching sales login:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/change-password', async (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ success: false, message: "Missing username or new password" });
    }

    try {
        const result = await loginPool.query(
            "UPDATE sales_report_login SET password = $1 WHERE username = $2 RETURNING *",
            [newPassword, username]
        );

        if (result.rowCount > 0) {
            res.json({ success: true, message: "Password updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start Server
app.listen(port, async () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    await testDBConnection();
    await testDBConnection2();
    await testDBConnection3();
});
