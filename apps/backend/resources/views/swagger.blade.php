<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stok Pangan Cerdas — Swagger API Documentation</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin: 0;
            background: #f8fafc;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            color: #0f172a;
        }
        .topbar {
            display: none !important;
        }
        .spc-navbar {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%);
            color: white;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(22, 101, 52, 0.2);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        .spc-logo-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .spc-badge {
            background: #dcfce7;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .spc-title {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .spc-nav-links {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .spc-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: white;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.15);
            padding: 7px 14px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.2s ease;
        }
        .spc-btn:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
        }
        .spc-btn-primary {
            background: #ffffff;
            color: #166534;
            border: 1px solid #ffffff;
        }
        .spc-btn-primary:hover {
            background: #f0fdf4;
            color: #15803d;
        }
        #swagger-ui {
            max-width: 1240px;
            margin: 0 auto;
            padding: 24px 16px 64px;
        }
        .swagger-ui .info {
            margin: 20px 0 30px;
        }
        .swagger-ui .info .title {
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-weight: 800;
            color: #0f172a;
        }
        .swagger-ui .btn.authorize {
            background-color: #16a34a;
            border-color: #16a34a;
            color: #fff;
        }
        .swagger-ui .btn.authorize svg {
            fill: #fff;
        }
    </style>
</head>
<body>
    <header class="spc-navbar">
        <div class="spc-logo-group">
            <span style="font-size: 24px;">🌾</span>
            <div>
                <h1 class="spc-title">Stok Pangan Cerdas <span class="spc-badge">Swagger 3.0</span></h1>
            </div>
        </div>
        <nav class="spc-nav-links">
            <a href="https://stok-pangan-cerdas.web.app" target="_blank" class="spc-btn spc-btn-primary">
                <span>Buka Frontend</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
            <a href="/up" target="_blank" class="spc-btn">
                <span>Health Check</span>
            </a>
            <a href="/api/openapi.json" target="_blank" class="spc-btn">
                <span>OpenAPI JSON</span>
            </a>
        </nav>
    </header>

    <div id="swagger-ui"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
        window.ui = SwaggerUIBundle({
            url: "/api/openapi.json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout",
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true
        });
    };
    </script>
</body>
</html>
