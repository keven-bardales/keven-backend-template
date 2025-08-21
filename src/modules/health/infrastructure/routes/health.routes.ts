/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and monitoring endpoints
 */
import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

export class HealthRoutes {
  private readonly router: Router;

  constructor(private readonly healthController: HealthController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     description: Returns the overall health status of the application and its dependencies
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is healthy or degraded but operational
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     status:
     *                       type: string
     *                       enum: [healthy, degraded, unhealthy]
     *                       example: healthy
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     uptime:
     *                       type: number
     *                       description: Uptime in seconds
     *                     version:
     *                       type: string
     *                       example: 1.0.0
     *                     environment:
     *                       type: string
     *                       example: production
     *                     checks:
     *                       type: object
     *                       properties:
     *                         database:
     *                           type: object
     *                           properties:
     *                             status:
     *                               type: string
     *                               enum: [healthy, degraded, unhealthy]
     *                             responseTime:
     *                               type: number
     *                             message:
     *                               type: string
     *                         memory:
     *                           type: object
     *                           properties:
     *                             status:
     *                               type: string
     *                               enum: [healthy, degraded, unhealthy]
     *                             message:
     *                               type: string
     *       503:
     *         description: Service is unhealthy
     */
    this.router.get(
      '/',
      this.asyncHandler(this.healthController.health.bind(this.healthController))
    );

    /**
     * @swagger
     * /health/live:
     *   get:
     *     summary: Kubernetes liveness probe
     *     description: Simple check to verify the service is alive and responding
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is alive
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     status:
     *                       type: string
     *                       example: alive
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     uptime:
     *                       type: number
     *                     pid:
     *                       type: number
     *       500:
     *         description: Service is not responding
     */
    this.router.get(
      '/live',
      this.asyncHandler(this.healthController.liveness.bind(this.healthController))
    );

    /**
     * @swagger
     * /health/ready:
     *   get:
     *     summary: Kubernetes readiness probe
     *     description: Check if the service is ready to accept traffic
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Service is ready
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     ready:
     *                       type: boolean
     *                       example: true
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     checks:
     *                       type: object
     *                       properties:
     *                         database:
     *                           type: boolean
     *                           example: true
     *                         migrations:
     *                           type: boolean
     *                           example: true
     *                         requiredServices:
     *                           type: boolean
     *                           example: true
     *       503:
     *         description: Service is not ready
     */
    this.router.get(
      '/ready',
      this.asyncHandler(this.healthController.readiness.bind(this.healthController))
    );

    /**
     * @swagger
     * /health/metrics:
     *   get:
     *     summary: Application metrics
     *     description: Returns detailed metrics about the application performance and resource usage
     *     tags: [Health]
     *     responses:
     *       200:
     *         description: Metrics retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                     uptime:
     *                       type: number
     *                     memory:
     *                       type: object
     *                       properties:
     *                         rss:
     *                           type: number
     *                         heapTotal:
     *                           type: number
     *                         heapUsed:
     *                           type: number
     *                         external:
     *                           type: number
     *                     cpu:
     *                       type: object
     *                       properties:
     *                         user:
     *                           type: number
     *                         system:
     *                           type: number
     *                     system:
     *                       type: object
     *                       properties:
     *                         loadAverage:
     *                           type: array
     *                           items:
     *                             type: number
     *                         totalMemory:
     *                           type: number
     *                         freeMemory:
     *                           type: number
     *                         cpus:
     *                           type: number
     *                         platform:
     *                           type: string
     *                         nodeVersion:
     *                           type: string
     *       500:
     *         description: Failed to collect metrics
     */
    this.router.get(
      '/metrics',
      this.asyncHandler(this.healthController.metrics.bind(this.healthController))
    );
  }

  private asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function createHealthRoutes(healthController: HealthController): Router {
  const healthRoutes = new HealthRoutes(healthController);
  return healthRoutes.getRouter();
}
