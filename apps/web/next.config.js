/** @type {import('next').NextConfig} */

const nextConfig = {
  /**
   * Deployment ID for Version-Skew Protection During Rolling Deployments
   *
   * When Railway deploys a new version of the frontend, multiple instances
   * may be running simultaneously — some old, some new. Without a deployment ID,
   * browsers with old JavaScript chunks would fail when trying to interact with
   * the new deployment, causing "Failed to find Server Action" and navigation errors.
   *
   * Next.js uses deploymentId to detect version skew:
   * - Static assets include ?dpl=<deploymentId> query parameter
   * - Client-side navigation requests include x-deployment-id header
   * - Server compares client deployment ID with its own
   * - Mismatch triggers a hard page reload (full page refresh)
   *
   * This ensures clients always fetch assets from a consistent deployment version.
   *
   * Railway provides RAILWAY_DEPLOYMENT_ID automatically during builds and deployments.
   * This value is unique per deployment, making it perfect for this purpose.
   *
   * If RAILWAY_DEPLOYMENT_ID is not set during build (e.g., local development),
   * deploymentId will be undefined and version-skew protection will be disabled
   * (graceful degradation). This is acceptable for development but should be
   * configured in production.
   *
   * Reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId
   */
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,

  reactStrictMode: true,
};

module.exports = nextConfig;
