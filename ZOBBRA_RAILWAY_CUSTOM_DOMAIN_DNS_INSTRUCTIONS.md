# ZOBBRA — Railway Custom Domain DNS Instructions

**Date**: August 27, 2026  
**Status**: Custom domains registered on Railway. Awaiting DNS record update in Hostinger.

---

## 1. Domain Configuration Summary

| Domain | Railway Target Service | Railway Domain ID | SSL Provisioning Status |
|---|---|---|---|
| **`zobbra.com`** | `web` (`45a31a0e-55f1-4039-a33c-895fe974b54f`) | `fcc88558-6371-49ce-be01-1d81af4805c3` | `VALIDATING_OWNERSHIP` |
| **`www.zobbra.com`** | `web` (via CNAME $\rightarrow$ `zobbra.com` / `03vvxved.up.railway.app`) | Standard CNAME Alias | Managed via apex/alias |
| **`api.zobbra.com`** | `zobra-server` (`d40f064b-bd64-41c4-80dc-fd7d4185fcf3`) | `6e15a9e0-62b4-414e-8ff8-525cbe4d5f68` | `VALIDATING_OWNERSHIP` |

---

## 2. Exact DNS Records to ADD / UPDATE in Hostinger

### A. Traffic Routing Records (Web & API)

| Action | Type | Name / Host | Required Value / Target | TTL | Purpose |
|---|---|---|---|---|---|
| **UPDATE / ADD** | `CNAME` (or `ALIAS`/`ANAME`) | `@` (or `zobbra.com`) | `03vvxved.up.railway.app` | `300` / Auto | Routes `zobbra.com` to Railway Web |
| **UPDATE / ADD** | `CNAME` | `www` | `03vvxved.up.railway.app` (or `zobbra.com`) | `300` / Auto | Routes `www.zobbra.com` to Railway Web |
| **UPDATE / ADD** | `CNAME` | `api` | `qgvnqczu.up.railway.app` | `300` / Auto | Routes `api.zobbra.com` to Railway API |

> [!NOTE]
> If Hostinger DNS does not allow CNAME on the root `@`, enter `03vvxved.up.railway.app` as ALIAS/ANAME, or check if Hostinger provides CNAME flattening.

---

### B. Ownership Verification Records (Railway Domain Verification)

| Action | Type | Name / Host | Required Value / Target | TTL |
|---|---|---|---|---|
| **ADD** | `TXT` | `_railway-verify` | `railway-verify=c90b854bb3a9a2d810bd7eae46a43a86a0ab4ec0bf857d470e7404356664d41c` | Auto |
| **ADD** | `TXT` | `_railway-verify.api` | `railway-verify=ad03b8c9c3ebfceb68b5eedbba68372774e5722c7ae82ac133f3a8891dfcc6c6` | Auto |

---

### C. Old Hostinger Records to REMOVE (To prevent 403 Conflict)

| Action | Type | Name / Host | Current Value | Reason |
|---|---|---|---|---|
| **DELETE** | `A` | `@` | `145.79.209.240` | Points to old Hostinger 403 server |
| **DELETE** | `AAAA` | `@` | `2a02:4780:11:2088:0:29c2:e57a:2` | Points to old Hostinger IPv6 |
| **DELETE** | `A` | `api` | `91.108.106.195`, `147.79.69.164` | Points to old Hostinger server |
| **DELETE** | `AAAA` | `api` | `2a02:4780:...` | Points to old Hostinger IPv6 |

---

### D. Email Records to KEEP UNTOUCHED (Zero Risk to Business Email)

| Type | Name | Value / Target | Priority | Status |
|---|---|---|---|---|
| `MX` | `@` | `mx1.hostinger.com` | `5` | ✅ **DO NOT TOUCH** |
| `MX` | `@` | `mx2.hostinger.com` | `10` | ✅ **DO NOT TOUCH** |
| `TXT` | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | — | ✅ **DO NOT TOUCH** |
| All DKIM / DMARC | `*` | Any `_domainkey` or `_dmarc` entries | — | ✅ **DO NOT TOUCH** |
