---
title: "Documentation Home"
layout: default
---

<!-- A. Compact Title + Version Indicator -->
<div class="page-header">
  <h1>ODS-E: Open Data Schema for Energy</h1>
  <div class="version-badge">
    <span class="version-label">Schema</span>
    <span class="version-value">v0.3.0</span>
    <span class="version-separator">|</span>
    <span class="version-label">Python</span>
    <span class="version-value">v0.2.0</span>
    <span class="version-separator">|</span>
    <span class="version-label">License</span>
    <span class="version-value">CC-BY-SA 4.0 / Apache 2.0</span>
  </div>
</div>

<!-- B. Quick Start CTA -->
<div class="quick-start-section">
  <a href="/docs/get-started" class="quick-start-button">
    Get Started in 5 Minutes
  </a>
  <p class="quick-start-subtext">
    Standardize energy data from any OEM — generation, consumption, and net metering
  </p>
</div>

<!-- C. Install -->
<div class="sdk-links-section">
  <h2>Install</h2>
  <div class="sdk-links-grid">
    <a href="/docs/get-started" class="sdk-link-card">
      <div class="sdk-icon">&#x1F40D;</div>
      <h3>Python</h3>
      <code class="sdk-install">pip install odse</code>
      <p>v0.2.0 &bull; Transform + Validate</p>
    </a>

    <a href="https://github.com/AsobaCloud/odse" class="sdk-link-card">
      <div class="sdk-icon">&#x1F4E6;</div>
      <h3>JSON Schemas</h3>
      <code class="sdk-install">schemas/*.json</code>
      <p>Language-agnostic spec</p>
    </a>

    <a href="https://github.com/AsobaCloud/odse/tree/main/transforms" class="sdk-link-card">
      <div class="sdk-icon">&#x1F527;</div>
      <h3>Transform Specs</h3>
      <code class="sdk-install">transforms/*.yaml</code>
      <p>10 OEM mappings</p>
    </a>
  </div>
</div>

<!-- D. Popular Quick Links -->
<div class="quick-links-section">
  <h2>Quick Links</h2>
  <div class="quick-links-grid">
    <a href="/docs/get-started" class="quick-link-card">
      <div class="quick-link-icon">&#x1F680;</div>
      <h4>Get Started</h4>
      <p>Install, transform, validate</p>
    </a>

    <a href="/docs/schemas/overview" class="quick-link-card">
      <div class="quick-link-icon">&#x1F4CB;</div>
      <h4>Schema Reference</h4>
      <p>Energy timeseries &amp; asset metadata</p>
    </a>

    <a href="/docs/transforms/overview" class="quick-link-card">
      <div class="quick-link-icon">&#x1F504;</div>
      <h4>Transforms</h4>
      <p>10 OEM mappings</p>
    </a>

    <a href="/docs/validation/overview" class="quick-link-card">
      <div class="quick-link-icon">&#x2705;</div>
      <h4>Validation</h4>
      <p>Schema &amp; semantic checks</p>
    </a>

    <a href="/docs/building-integration/overview" class="quick-link-card">
      <div class="quick-link-icon">&#x1F3D7;</div>
      <h4>Building Integration</h4>
      <p>ComStock/ResStock mapping</p>
    </a>

    <a href="https://github.com/AsobaCloud/odse" class="quick-link-card">
      <div class="quick-link-icon">&#x1F4BB;</div>
      <h4>GitHub</h4>
      <p>Source, issues, PRs</p>
    </a>
  </div>
</div>

<!-- E. Code Examples -->
<div class="code-examples-section">
  <h2>Code Examples</h2>
  <p class="section-intro">Copy-paste examples to get started quickly</p>

  <div class="code-examples-grid">
    <div class="code-example-card" data-language="python">
      <h4>Transform OEM Data</h4>
      <pre><code>from odse import transform

# Huawei CSV to ODS-E records
rows = transform("huawei_export.csv", source="huawei")
print(rows[0])
# {"timestamp": "2026-02-09T12:00:00Z",
#  "kWh": 4.17, "error_type": "normal"}</code></pre>
      <a href="/docs/get-started" class="code-example-link">View Full Example &rarr;</a>
    </div>

    <div class="code-example-card" data-language="python">
      <h4>Validate Consumption Data</h4>
      <pre><code>from odse import validate

result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 12.3,
    "error_type": "normal",
    "direction": "consumption",
    "end_use": "cooling",
    "fuel_type": "electricity"
})
print(result.is_valid)  # True</code></pre>
      <a href="/docs/validation/overview" class="code-example-link">View Validation Guide &rarr;</a>
    </div>
  </div>
</div>

<!-- F. What ODS-E Covers -->
<div class="product-categories-section">
  <h2>What ODS-E Covers</h2>
  <div class="product-categories-grid">
    <a href="/docs/schemas/energy-timeseries" class="product-category-card">
      <h4>Generation</h4>
      <p>Solar, wind, CHP &mdash; 10 OEM transforms included</p>
    </a>

    <a href="/docs/schemas/energy-timeseries" class="product-category-card">
      <h4>Consumption</h4>
      <p>Grid meters, sub-meters, end-use tagging</p>
    </a>

    <a href="/docs/schemas/energy-timeseries" class="product-category-card">
      <h4>Net Metering</h4>
      <p>Bidirectional flows with signed kWh</p>
    </a>

    <a href="/docs/schemas/asset-metadata" class="product-category-card">
      <h4>Asset Taxonomy</h4>
      <p>10 asset types from solar PV to fuel cells</p>
    </a>

    <a href="/docs/building-integration/comstock-resstock" class="product-category-card">
      <h4>Building Metadata</h4>
      <p>ComStock/ResStock-compatible fields</p>
    </a>

    <a href="/docs/validation/overview" class="product-category-card">
      <h4>Validation</h4>
      <p>Schema + semantic + physical bounds</p>
    </a>
  </div>
</div>

<!-- G. Supported OEMs -->
<div class="version-updates-section">
  <div class="version-info">
    <h3>Supported OEMs</h3>
    <p>Huawei, Enphase, Solarman, SolarEdge, Fronius, Switch, SMA, FIMER, Solis, SolaX</p>
    <a href="/docs/transforms/supported-oems" class="changelog-link">View Support Matrix &rarr;</a>
  </div>

  <div class="whats-new">
    <h3>What's New in v0.3.0</h3>
    <ul class="whats-new-list">
      <li>Direction-aware energy timeseries (generation / consumption / net)</li>
      <li>End-use tagging aligned with ComStock/ResStock</li>
      <li>Building metadata and asset type taxonomy</li>
      <li>10 OEM runtime transforms with test harness</li>
    </ul>
    <a href="https://github.com/AsobaCloud/odse/blob/main/CHANGELOG.md" class="whats-new-link">Read Changelog &rarr;</a>
  </div>
</div>

<!-- H. Documentation Sections -->
<div class="sections-overview">
  <h2>Documentation Sections</h2>
  <div class="section-cards">
    <div class="section-card">
      <h3>Getting Started</h3>
      <p>Install the library, transform OEM data, and validate records in 5 minutes</p>
      <a href="/docs/get-started" class="section-link">Get Started &rarr;</a>
    </div>

    <div class="section-card">
      <h3>Schema Reference</h3>
      <p>Energy timeseries and asset metadata field definitions and enums</p>
      <a href="/docs/schemas/overview" class="section-link">View Schemas &rarr;</a>
    </div>

    <div class="section-card">
      <h3>Transforms</h3>
      <p>OEM-to-ODS-E mapping specs and runtime transform functions</p>
      <a href="/docs/transforms/overview" class="section-link">View Transforms &rarr;</a>
    </div>

    <div class="section-card">
      <h3>Validation</h3>
      <p>Schema validation, semantic checks, and physical bounds verification</p>
      <a href="/docs/validation/overview" class="section-link">View Validation &rarr;</a>
    </div>

    <div class="section-card">
      <h3>Building Integration</h3>
      <p>Join ODS-E data to NREL ComStock/ResStock benchmarks for EUI analysis</p>
      <a href="/docs/building-integration/overview" class="section-link">View Guide &rarr;</a>
    </div>

    <div class="section-card">
      <h3>Contributing</h3>
      <p>Add OEM transforms, improve schemas, and submit pull requests</p>
      <a href="https://github.com/AsobaCloud/odse/blob/main/CONTRIBUTING.md" class="section-link">Contribute &rarr;</a>
    </div>
  </div>
</div>

<!-- I. Community -->
<div class="community-section">
  <h2>Community &amp; Support</h2>
  <div class="community-links-grid">
    <a href="https://github.com/AsobaCloud/odse" target="_blank" class="community-link-card">
      <div class="community-icon">&#x1F419;</div>
      <h4>GitHub</h4>
      <p>Source code &amp; issues</p>
    </a>

    <a href="https://discord.gg/2MmDG2uTxX" target="_blank" class="community-link-card">
      <div class="community-icon">&#x1F4AC;</div>
      <h4>Discord</h4>
      <p>Join the community</p>
    </a>

    <a href="mailto:support@asoba.co" class="community-link-card">
      <div class="community-icon">&#x1F4E7;</div>
      <h4>Email Support</h4>
      <p>Get help from the team</p>
    </a>
  </div>
</div>

&copy; 2026 Asoba Corporation. All rights reserved. ODS-E specification licensed under CC-BY-SA 4.0.
