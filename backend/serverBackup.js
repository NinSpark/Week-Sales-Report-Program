// require('dotenv').config();
// const express = require('express');
// const sql = require('mssql');
// const cors = require('cors');

// const app = express();
// const port = 4000;

// // Enable CORS for Angular frontend
// app.use(cors());
// app.use(express.json());

// // Database Configuration
// const kaiShenConfig = {
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     server: process.env.DB_SERVER,
//     database: process.env.DB_DATABASE,
//     port: parseInt(process.env.DB_PORT, 10),
//     options: {
//         encrypt: false, // Disable encryption
//         trustServerCertificate: true, // Trust the self-signed SSL certificate
//         enableArithAbort: true,
//     }
// };

// const lensoConfig = {
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     server: process.env.DB_SERVER,
//     database: process.env.DB_LENSO,
//     port: parseInt(process.env.DB_PORT, 10),
//     options: {
//         encrypt: false, // Disable encryption
//         trustServerCertificate: true, // Trust the self-signed SSL certificate
//         enableArithAbort: true,
//     }
// };

// // Test Database Connection
// async function testDBConnection() {
//     try {
//         await sql.connect(kaiShenConfig);
//         console.log("✅ Kai Shen Database connected successfully!");
//     } catch (err) {
//         console.error("❌ Kai Shen Database connection failed:", err.message);
//     }
// }
// // Test Database Connection
// async function testDBConnection2() {
//     try {
//         await sql.connect(lensoConfig);
//         console.log("✅ Lenso Database connected successfully!");
//     } catch (err) {
//         console.error("❌ Lenso Database connection failed:", err.message);
//     }
// }

// // API to fetch unique SalesAgents for dropdown
// app.get('/api/sales-agents', async (req, res) => {
//     try {
//         const result = await sql.query`SELECT DISTINCT SalesAgent FROM dbo.IV WHERE SalesAgent IS NOT NULL`;
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching SalesAgents:', err);
//         res.status(500).send('Server error');
//     }
// });

// // Fetch invoices for logged-in SalesAgent
// app.get('/api/invoices', async (req, res) => {
//     try {
//         const salesAgent = req.query.salesAgent;
//         if (!salesAgent) {
//             return res.status(400).json({ error: 'Missing SalesAgent parameter' });
//         }

//         const query = `SELECT DocKey, DocNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName, ShipInfo FROM dbo.IV 
//                        WHERE SalesAgent = @salesAgent 
//                        AND DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`;

//         const request = new sql.Request();
//         request.input('salesAgent', sql.NVarChar, salesAgent);

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching invoices:', err);
//         res.status(500).send('Server error');
//     }
// });

// // **Get invoice details from dbo.IVDTL based on DocKey**
// app.get('/api/invoice-details', async (req, res) => {
//     try {
//         const docKey = req.query.docKey;
//         if (!docKey) {
//             return res.status(400).send('Missing docKey parameter');
//         }

//         const request = new sql.Request();
//         request.input('docKey', sql.Int, docKey);

//         const result = await request.query(`
//             SELECT ItemCode, Description, ProjNo, UOM, Qty, SmallestQty, UnitPrice, SubTotal
//             FROM dbo.IVDTL
//             WHERE DocKey = @docKey
//             AND ItemCode NOT LIKE 'Z%'
//         `);

//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching invoice details:', err);
//         res.status(500).send('Server error');
//     }
// });

// app.get("/filtered-invoices", async (req, res) => {
//     try {
//         await sql.connect(kaiShenConfig);

//         const { salesAgent, startDate, endDate, shipInfo } = req.query;
//         let shipInfoList = JSON.parse(shipInfo);

//         let query = `
//             SELECT i.DocKey, i.DocNo, i.DebtorName, i.ShipInfo, i.DocDate, 
//                    d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ProjNo
//             FROM IV i
//             JOIN IVDTL d ON i.DocKey = d.DocKey
//             WHERE i.SalesAgent = @salesAgent
//               AND i.DocDate BETWEEN @startDate AND @endDate
//             AND ItemCode NOT LIKE 'Z%'
//         `;

//         if (shipInfoList.length > 0) {
//             query += ` AND i.ShipInfo IN (${shipInfoList.map((_, i) => `@ship${i}`).join(",")})`;
//         }

//         let request = new sql.Request();
//         request.input("salesAgent", sql.VarChar, salesAgent);
//         request.input("startDate", sql.Date, startDate);
//         request.input("endDate", sql.Date, endDate);
//         shipInfoList.forEach((value, index) => request.input(`ship${index}`, sql.VarChar, value));

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (error) {
//         console.error("Database query error:", error);
//         res.status(500).send("Error retrieving invoices.");
//     }
// });

// // API: Get CNs for Current Week
// app.get('/api/credit-notes', async (req, res) => {
//     try {
//         const salesAgent = req.query.salesAgent;

//         if (!salesAgent) {
//             return res.status(400).json({ error: 'Missing SalesAgent parameter' });
//         }

//         const query = `SELECT DocNo, OurInvoiceNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName 
//                        FROM dbo.CN 
//                        WHERE SalesAgent = @salesAgent
//                        AND CNType = 'RETURN' 
//                        AND DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`;

//         const pool = await sql.connect(); // Ensure a connection is established
//         const request = pool.request();
//         request.input('salesAgent', sql.NVarChar, salesAgent);

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching Credit Note:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // **Get CN details from dbo.CNDTL based on DocKey**
// app.get('/api/credit-note-details', async (req, res) => {
//     try {
//         const docKey = req.query.docKey;
//         if (!docKey) {
//             return res.status(400).send('Missing docKey parameter');
//         }

//         const request = new sql.Request();
//         request.input('docKey', sql.Int, docKey);

//         const result = await request.query(`SELECT DocKey, ItemCode, Description, ProjNo, Qty, SmallestQty, SubTotal, AccNo FROM dbo.CNDTL 
//                      WHERE DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`);

//         res.json(result.recordset);
//     } catch (err) {
//         console.error('Error fetching credit notes:', err);
//         res.status(500).send('Server error');
//     }
// });

// app.get("/filtered-credit-notes", async (req, res) => {
//     try {
//         await sql.connect(kaiShenConfig);

//         const { salesAgent, startDate, endDate, shipInfo } = req.query;
//         let refList = JSON.parse(shipInfo);

//         let query = `
//             SELECT i.DocKey, i.DocNo, i.DebtorName, i.DocDate, i.SalesAgent, i.CNType, i.Ref, i.BranchCode,
//                    d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ItemCode, d.UOM, d.UnitPrice, d.ProjNo
//             FROM CN i
//             JOIN CNDTL d ON i.DocKey = d.DocKey
//             WHERE i.SalesAgent = @salesAgent
//             AND i.CNType = 'RETURN'
//               AND i.DocDate BETWEEN @startDate AND @endDate`;

//         if (refList.length > 0) {
//             query += ` AND i.Ref IN (${refList.map((_, i) => `@ship${i}`).join(",")})`;
//         }

//         let request = new sql.Request();
//         request.input("salesAgent", sql.VarChar, salesAgent);
//         request.input("startDate", sql.Date, startDate);
//         request.input("endDate", sql.Date, endDate);
//         refList.forEach((value, index) => request.input(`ship${index}`, sql.VarChar, value));

//         const result = await request.query(query);
//         res.json(result.recordset);
//     } catch (error) {
//         console.error("Database query error:", error);
//         res.status(500).send("Error retrieving invoices.");
//     }
// });

// // Start Server
// app.listen(port, async () => {
//     console.log(`🚀 Server running at http://localhost:${port}`);
//     await testDBConnection();
//     await testDBConnection2();
// });

// -----------------------------------------------------------------------------------------

require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 4000;

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

        const query = `SELECT DocKey, DocNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName, ShipInfo 
                   FROM dbo.IV WHERE SalesAgent = @salesAgent 
                   AND DocDate >= DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)`;

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
            SELECT i.DocKey, i.DocNo, i.DebtorName, i.ShipInfo, i.DocDate, 
                   d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ProjNo
            FROM IV i
            JOIN IVDTL d ON i.DocKey = d.DocKey
            WHERE i.SalesAgent = @salesAgent
              AND i.DocDate BETWEEN @startDate AND @endDate
            AND ItemCode NOT LIKE 'Z%'
        `;

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

        const query = `SELECT DocNo, OurInvoiceNo, DocDate, SalesAgent, BranchCode, NetTotal, DebtorName 
                       FROM dbo.CN 
                       WHERE SalesAgent = @salesAgent
                       AND CNType = 'RETURN' 
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
            SELECT i.DocKey, i.DocNo, i.DebtorName, i.DocDate, i.SalesAgent, i.CNType, i.Ref, i.BranchCode,
                   d.Description, d.Qty, d.SubTotal, d.SmallestQty, d.ItemCode, d.UOM, d.UnitPrice, d.ProjNo
            FROM CN i
            JOIN CNDTL d ON i.DocKey = d.DocKey
            WHERE i.SalesAgent = @salesAgent
            AND i.CNType = 'RETURN'
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

// Start Server
app.listen(port, async () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    await testDBConnection();
    await testDBConnection2();
});